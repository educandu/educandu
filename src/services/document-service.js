import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import DocumentLockStore from '../stores/document-lock-store.js';
import { getPluginInfoByType } from '../plugins/plugin-infos.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';

const logger = new Logger(import.meta.url);

const metadataProjection = {
  _id: 1,
  key: 1,
  order: 1,
  revision: 1,
  title: 1,
  slug: 1,
  namespace: 1,
  language: 1,
  createdOn: 1,
  createdBy: 1,
  updatedOn: 1,
  updatedBy: 1,
  tags: 1,
  archived: 1,
  origin: 1,
  originUrl: 1
};

const searchResultsProjection = {
  title: 1,
  key: 1,
  slug: 1,
  updatedOn: 1,
  tags: 1,
  archived: 1,
  language: 1
};

const getTagsQuery = searchString => [
  { $unwind: '$tags' },
  {
    $match:
    {
      $and: [
        { tags: { $regex: `.*${searchString}.*`, $options: 'i' } },
        { slug: { $ne: null } }
      ]
    }
  },
  { $group: { _id: null, uniqueTags: { $push: '$tags' } } },
  {
    $project: {
      _id: 0,
      uniqueTags: {
        $reduce: {
          input: '$uniqueTags',
          initialValue: [],
          in: {
            $let: {
              vars: { elem: { $concatArrays: [['$$this'], '$$value'] } },
              in: { $setUnion: '$$elem' }
            }
          }
        }
      }
    }
  }
];

const lastUpdatedFirst = [['updatedOn', -1]];

class DocumentService {
  static get inject() {
    return [DocumentRevisionStore, DocumentOrderStore, DocumentLockStore, DocumentStore];
  }

  constructor(documentRevisionStore, documentOrderStore, documentLockStore, documentStore) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
  }

  getAllDocumentsMetadata({ includeArchived } = {}) {
    const filter = {};
    if (!includeArchived) {
      filter.archived = false;
    }
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: metadataProjection });
  }

  async getDocumentsByTags(searchQuery, { includeArchived } = {}) {
    const searchTags = new Set(searchQuery.trim()
      .split(/\s+/)
      .map(tag => escapeStringRegexp(tag.toLowerCase()))
      .filter(tag => tag.length > 2));

    if (!searchTags.size) {
      return [];
    }

    let query = {
      $or: Array.from(searchTags).map(tag => ({
        tags: {
          $regex: `.*${tag}.*`, $options: 'i'
        }
      }))
    };

    if (!includeArchived) {
      query = { $and: [query, { archived: false }] };
    }

    const documents = await this.documentStore
      .find(query, { projection: searchResultsProjection }) || [];

    return documents.map(result => ({
      ...result,
      tagMatchCount: result.tags
        .filter(tag => searchTags.has(tag.toLowerCase())).length
    }));
  }

  getDocumentByKey(documentKey) {
    return this.documentStore.findOne({ _id: documentKey });
  }

  getDocumentByNamespaceAndSlug(namespace, slug) {
    return this.documentStore.findOne({ namespace, slug });
  }

  getAllDocumentRevisionsByKey(documentKey) {
    return this.documentRevisionStore.find({ key: documentKey }, { sort: [['order', 1]] });
  }

  getCurrentDocumentRevisionByKey(documentKey) {
    return this.documentRevisionStore.findOne({ key: documentKey }, { sort: [['order', -1]] });
  }

  getDocumentRevisionById(id) {
    return this.documentRevisionStore.findOne({ _id: id });
  }

  findRevisionTags(searchString) {
    return this.documentRevisionStore.toAggregateArray(getTagsQuery(searchString));
  }

  findDocumentTags(searchString) {
    return this.documentStore.toAggregateArray(getTagsQuery(searchString));
  }

  createNewDocumentRevision({ doc, user, restoredFrom = null }) {
    const documentKey = doc.appendTo ? doc.appendTo.key : uniqueId.create();
    const revisionId = uniqueId.create();

    return this._createDocumentRevision({ doc, revisionId, documentKey, user, mapNewSections: this._createNewSections, restoredFrom });
  }

  copyDocumentRevision({ doc, user }) {
    const documentKey = doc.appendTo ? doc.appendTo.key : doc.key;
    const revisionId = doc._id;

    return this._createDocumentRevision({ doc, revisionId, documentKey, user, mapNewSections: this._copySections });
  }

  async restoreDocumentRevision({ documentKey, revisionId, user }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    const revisionToRestore = await this.getDocumentRevisionById(revisionId);
    if (revisionToRestore?.key !== documentKey) {
      throw new Error(`Revision ${revisionId} is not valid`);
    }

    const latestRevision = await this.getCurrentDocumentRevisionByKey(documentKey);
    if (revisionToRestore._id === latestRevision._id) {
      throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
    }

    const doc = {
      title: revisionToRestore.title,
      slug: revisionToRestore.slug,
      namespace: revisionToRestore.namespace,
      language: revisionToRestore.language,
      sections: cloneDeep(revisionToRestore.sections),
      appendTo: {
        key: documentKey,
        ancestorId: latestRevision._id
      },
      tags: revisionToRestore.tags
    };

    await this.createNewDocumentRevision({ doc, user, restoredFrom: revisionToRestore._id });

    return this.getAllDocumentRevisionsByKey(documentKey);
  }

  async hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    let lock;
    const now = new Date();
    const userId = user._id;

    try {

      logger.info(`Hard deleting sections with section key ${sectionKey} in documents with key ${documentKey}`);

      lock = await this.documentLockStore.takeLock(documentKey);

      const allRevisions = await this.getAllDocumentRevisionsByKey(documentKey);

      const revisionsToUpdate = [];

      for (const revision of allRevisions) {
        for (const section of revision.sections) {
          if (section.key === sectionKey && !section.deletedOn) {
            // eslint-disable-next-line max-depth
            if (section.revision === sectionRevision || deleteAllRevisions) {
              section.deletedOn = now;
              section.deletedBy = userId;
              section.deletedBecause = reason;
              section.content = null;
              revisionsToUpdate.push(revision);
            }
          }
        }
      }

      if (revisionsToUpdate.length) {
        logger.info(`Hard deleting %d sections with section key ${sectionKey} in document revisions with key ${documentKey}`, revisionsToUpdate);
        await this.documentRevisionStore.saveMany(revisionsToUpdate);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for key ${documentKey}`);
      }

      const latestDocument = this._createDocumentFromRevisions(allRevisions);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.save(latestDocument);

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async setArchivedState({ documentKey, user, archived }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    const latestRevision = await this.getCurrentDocumentRevisionByKey(documentKey);
    const nextOrder = await this.documentOrderStore.getNextOrder();

    const newRevision = this._buildDocumentRevision({ doc: latestRevision, documentKey, userId: user._id, nextOrder });

    newRevision.appendTo = {
      key: documentKey,
      ancestorId: latestRevision._id
    };
    newRevision.archived = archived;

    return this.createNewDocumentRevision({ doc: newRevision, user });
  }

  async _createDocumentRevision({ doc, revisionId, documentKey, user, mapNewSections, restoredFrom = null }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    let lock;
    const userId = user._id;
    const isAppendedRevision = !!doc.appendTo;
    const ancestorId = isAppendedRevision ? doc.appendTo.ancestorId : null;

    try {
      let existingDocumentRevisions;
      let ancestorRevision;

      logger.info(`Creating new document revision for document key ${documentKey}`);

      lock = await this.documentLockStore.takeLock(documentKey);

      if (isAppendedRevision) {
        existingDocumentRevisions = await this.getAllDocumentRevisionsByKey(documentKey);
        if (!existingDocumentRevisions.length) {
          throw new Error(`Cannot append new revision for key ${documentKey}, because there are no existing revisions`);
        }

        logger.info(`Found ${existingDocumentRevisions.length} existing revisions for key ${documentKey}`);
        ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision._id !== ancestorId) {
          throw new Error(`Ancestor id ${ancestorId} is not the latest revision`);
        }
      } else {
        existingDocumentRevisions = [];
        ancestorRevision = null;
      }

      const newSections = mapNewSections({ sections: doc.sections, ancestorSections: ancestorRevision?.sections, restoredFrom });

      const nextOrder = await this.documentOrderStore.getNextOrder();
      const newDocumentRevision = this._buildDocumentRevision({ doc, revisionId, documentKey, userId, nextOrder, restoredFrom, sections: newSections });
      logger.info(`Saving new document revision with id ${newDocumentRevision._id}`);
      await this.documentRevisionStore.save(newDocumentRevision);

      const latestDocument = this._createDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.save(latestDocument);

      return newDocumentRevision;

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  _createNewSections({ sections, ancestorSections = [], restoredFrom = null }) {
    return sections.map(section => {
      const sectionKey = section.key;
      const ancestorSection = ancestorSections.find(s => s.key === sectionKey) || null;

      if (ancestorSection) {
        logger.info(`Found ancestor section with key ${sectionKey}`);

        if (ancestorSection.type !== section.type) {
          throw new Error(`Ancestor section has type ${ancestorSection.type} and cannot be changed to ${section.type}`);
        }

        if (ancestorSection.deletedOn && section.content) {
          throw new Error(`Ancestor section with key ${sectionKey} is deleted and cannot be changed`);
        }

        // If not changed, re-use existing revision:
        if (deepEqual(ancestorSection.content, section.content)) {
          logger.info(`Section has not changed compared to ancestor section with revision ${ancestorSection.revision}, using the existing`);
          return cloneDeep(ancestorSection);
        }
      }

      if (!section.content && !restoredFrom) {
        throw new Error('Sections that are not deleted must specify a content');
      }

      logger.info(`Creating new revision for section key ${sectionKey}`);

      // Create a new section revision:
      return {
        revision: uniqueId.create(),
        key: sectionKey,
        deletedOn: null,
        deletedBy: null,
        deletedBecause: null,
        type: section.type,
        content: section.content && cloneDeep(section.content)
      };
    });
  }

  _copySections({ sections }) {
    return sections.map(section => ({
      revision: section.revision,
      key: section.key,
      deletedOn: null,
      deletedBy: null,
      deletedBecause: null,
      type: section.type,
      content: section.content && cloneDeep(section.content)
    }));
  }

  _buildDocumentRevision({ doc, revisionId, documentKey, userId, nextOrder, restoredFrom, sections }) {
    logger.info(`Creating new revision for document key ${documentKey} with order ${nextOrder}`);

    const newSections = sections || doc.sections;
    return {
      _id: revisionId || uniqueId.create(),
      key: documentKey,
      order: nextOrder,
      restoredFrom: restoredFrom || '',
      createdOn: new Date(),
      createdBy: userId || '',
      title: doc.title || '',
      slug: doc.slug || '',
      namespace: doc.namespace || '',
      language: doc.language || '',
      sections: newSections,
      tags: doc.tags || [],
      archived: doc.archived || false,
      origin: doc.origin || DOCUMENT_ORIGIN.internal,
      originUrl: doc.originUrl || '',
      cdnResources: this._getCdnResources(newSections)
    };
  }

  _createDocumentFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = Array.from(new Set(revisions.map(r => r.createdBy)));

    return {
      _id: lastRevision.key,
      key: lastRevision.key,
      order: lastRevision.order,
      revision: lastRevision._id,
      createdOn: firstRevision.createdOn,
      createdBy: firstRevision.createdBy,
      updatedOn: lastRevision.createdOn,
      updatedBy: lastRevision.createdBy,
      title: lastRevision.title,
      slug: lastRevision.slug,
      namespace: lastRevision.namespace,
      language: lastRevision.language,
      sections: lastRevision.sections,
      contributors,
      tags: lastRevision.tags,
      archived: lastRevision.archived,
      origin: lastRevision.origin,
      originUrl: lastRevision.originUrl,
      cdnResources: lastRevision.cdnResources
    };
  }

  _getCdnResources(sections) {
    return [
      ...sections.reduce((cdnResources, section) => {
        const info = getPluginInfoByType(section.type);
        if (info && section.content) {
          info.getCdnResources(section.content).forEach(resource => {
            cdnResources.add(resource);
          });
        }
        return cdnResources;
      }, new Set())
    ];
  }
}

export default DocumentService;
