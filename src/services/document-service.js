import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import BatchStore from '../stores/batch-store.js';
import InfoFactory from '../plugins/info-factory.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentLockStore from '../stores/document-lock-store.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { BATCH_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const metadataProjection = {
  _id: 1,
  key: 1,
  order: 1,
  revision: 1,
  title: 1,
  slug: 1,
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
    return [
      DocumentRevisionStore,
      DocumentOrderStore,
      DocumentLockStore,
      DocumentStore,
      BatchStore,
      TaskStore,
      TransactionRunner,
      InfoFactory
    ];
  }

  constructor(documentRevisionStore, documentOrderStore, documentLockStore, documentStore, batchStore, taskStore, transactionRunner, infoFactory) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.transactionRunner = transactionRunner;
    this.infoFactory = infoFactory;
  }

  getAllDocumentsMetadata({ includeArchived } = {}) {
    const filter = {};
    if (!includeArchived) {
      filter.archived = false;
    }
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: metadataProjection });
  }

  async getDocumentsByTags(searchQuery) {
    const tokens = searchQuery.trim().split(/\s+/);

    const positiveTokens = new Set(tokens
      .filter(token => !token.startsWith('-'))
      .filter(token => token.length > 2)
      .map(token => escapeStringRegexp(token.toLowerCase())));

    const negativeTokens = new Set(tokens
      .filter(token => token.startsWith('-'))
      .map(token => token.substr(1))
      .filter(token => token.length > 2)
      .map(token => escapeStringRegexp(token.toLowerCase())));

    if (!positiveTokens.size) {
      return [];
    }

    const queryConditions = [
      { archived: false },
      { tags: { $regex: `.*(${[...positiveTokens].join('|')}).*`, $options: 'i' } }
    ];

    if (negativeTokens.size) {
      queryConditions.push({ tags: { $not: { $regex: `^(${[...negativeTokens].join('|')})$`, $options: 'i' } } });
    }

    const documents = await this.documentStore
      .find({ $and: queryConditions }, { projection: searchResultsProjection }) || [];

    return documents.map(document => ({
      ...document,
      tagMatchCount: document.tags.filter(tag => positiveTokens.has(tag.toLowerCase())).length
    }));
  }

  getDocumentByKey(documentKey) {
    return this.documentStore.findOne({ _id: documentKey });
  }

  getAllDocumentRevisionsByKey(documentKey) {
    return this._getAllDocumentRevisionsByKey(documentKey);
  }

  _getAllDocumentRevisionsByKey(documentKey, session = null) {
    return this.documentRevisionStore.find({ key: documentKey }, { sort: [['order', 1]], session });
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
      language: revisionToRestore.language,
      sections: cloneDeep(revisionToRestore.sections),
      appendTo: {
        key: documentKey,
        ancestorId: latestRevision._id
      },
      tags: revisionToRestore.tags
    };

    await this.createNewDocumentRevision({ doc, user, restoredFrom: revisionToRestore._id });

    return this._getAllDocumentRevisionsByKey(documentKey);
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

      const revisionsBeforeDelete = await this._getAllDocumentRevisionsByKey(documentKey);

      const revisionsAfterDelete = [];
      const revisionsToUpdateById = new Map();

      for (const originalRevision of revisionsBeforeDelete) {
        let finalRevision = originalRevision;

        for (const section of finalRevision.sections) {
          if (section.key === sectionKey && !section.deletedOn && (section.revision === sectionRevision || deleteAllRevisions)) {
            section.deletedOn = now;
            section.deletedBy = userId;
            section.deletedBecause = reason;
            section.content = null;

            finalRevision = this._buildDocumentRevision({
              data: finalRevision,
              revisionId: finalRevision._id,
              documentKey: finalRevision.key,
              userId: finalRevision.createdBy,
              order: finalRevision.order,
              restoredFrom: finalRevision.restoredFrom,
              sections: finalRevision.sections
            });

            revisionsToUpdateById.set(finalRevision._id, finalRevision);
          }
        }

        revisionsAfterDelete.push(finalRevision);
      }

      if (revisionsToUpdateById.size) {
        logger.info(`Hard deleting ${revisionsToUpdateById.size} sections with section key ${sectionKey} in document revisions with key ${documentKey}`);
        await this.documentRevisionStore.saveMany([...revisionsToUpdateById.values()]);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for key ${documentKey}`);
      }

      const latestDocument = this._buildDocumentFromRevisions(revisionsAfterDelete);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.save(latestDocument);

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async hardDeleteDocument(documentKey) {
    const document = await this.getDocumentByKey(documentKey);

    if (!document.origin.startsWith(DOCUMENT_ORIGIN.external)) {
      throw new Error(`Only external documents can be hard deleted. Document '${documentKey}' has origin '${document.origin}'`);
    }

    let lock;
    try {
      lock = await this.documentLockStore.takeLock(documentKey);

      logger.info(`Hard deleting external document '${documentKey}'`);

      await this.transactionRunner.run(async session => {
        await this.documentRevisionStore.deleteMany({ key: documentKey }, { session });
        await this.documentStore.deleteOne({ key: documentKey }, { session });
      });

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

    const doc = {
      title: latestRevision.title,
      slug: latestRevision.slug,
      language: latestRevision.language,
      sections: latestRevision.sections,
      appendTo: {
        key: documentKey,
        ancestorId: latestRevision._id
      },
      tags: latestRevision.tags,
      archived
    };

    return this.createNewDocumentRevision({ doc, user });
  }

  async createNewDocumentRevision({ doc, user, restoredFrom = null }) {
    if (!user?._id) {
      throw new Error('No user specified');
    }

    let lock;
    const userId = user._id;
    const isAppendedRevision = !!doc.appendTo;
    const ancestorId = isAppendedRevision ? doc.appendTo.ancestorId : null;
    const documentKey = isAppendedRevision ? doc.appendTo.key : uniqueId.create();

    try {

      let existingDocumentRevisions;
      let ancestorRevision;

      logger.info(`Creating new document revision for document key ${documentKey}`);

      lock = await this.documentLockStore.takeLock(documentKey);

      if (isAppendedRevision) {
        existingDocumentRevisions = await this._getAllDocumentRevisionsByKey(documentKey);
        if (!existingDocumentRevisions.length) {
          throw new Error(`Cannot append new revision for key ${documentKey}, because there are no existing revisions`);
        }

        logger.info(`Found ${existingDocumentRevisions.length} existing revisions for key ${documentKey}`);
        ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision._id !== ancestorId) {
          throw new Error(`Ancestor id ${ancestorId} is not the latest revision`);
        }

        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new Error(`Ancestor id ${ancestorId} is not an internal document`);
        }
      } else {
        existingDocumentRevisions = [];
        ancestorRevision = null;
      }

      const newSections = doc.sections.map(section => {
        const sectionKey = section.key;
        const ancestorSection = ancestorRevision?.sections.find(s => s.key === sectionKey) || null;

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

      const order = await this.documentOrderStore.getNextOrder();
      const newDocumentRevision = this._buildDocumentRevision({ data: doc, documentKey, userId, order, restoredFrom, sections: newSections });
      logger.info(`Saving new document revision with id ${newDocumentRevision._id}`);

      await this.documentRevisionStore.save(newDocumentRevision);

      const latestDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.save(latestDocument);

      return newDocumentRevision;

    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async copyDocumentRevisions({ revisions, ancestorId, origin, originUrl }) {
    let lock;
    const newDocumentRevisions = [];
    const documentKey = revisions[0].key;

    try {
      lock = await this.documentLockStore.takeLock(documentKey);

      await this.transactionRunner.run(async session => {

        const existingDocumentRevisions = await this._getAllDocumentRevisionsByKey(documentKey, session);
        const latestExistingRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (!ancestorId && latestExistingRevision) {
          throw new Error(`Found unexpected existing revisions for document '${documentKey}'`);
        }

        if (ancestorId && latestExistingRevision?._id !== ancestorId) {
          throw new Error(`Import of document '${documentKey}' expected to find revision '${ancestorId}' as the latest revision but found revision '${latestExistingRevision?._id}'`);
        }

        for (const revision of revisions) {
          const data = { ...revision, origin, originUrl };

          // eslint-disable-next-line no-await-in-loop
          const order = await this.documentOrderStore.getNextOrder();

          newDocumentRevisions.push(this._buildDocumentRevision({
            data,
            revisionId: revision._id,
            documentKey,
            userId: revision.createdBy,
            order,
            restoredFrom: revision.restoredFrom,
            sections: cloneDeep(revision.sections)
          }));
        }

        logger.info(`Saving revisions for document '${documentKey}'`);
        await this.documentRevisionStore.saveMany(newDocumentRevisions);

        const document = this._buildDocumentFromRevisions([...existingDocumentRevisions, ...newDocumentRevisions]);

        logger.info(`Saving document '${documentKey}' with revision ${document.revision}`);
        await this.documentStore.save(document, { session });
      });

      return newDocumentRevisions;
    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async regenerateDocument(documentKey) {
    let lock;

    try {
      lock = await this.documentLockStore.takeLock(documentKey);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this._getAllDocumentRevisionsByKey(documentKey, session);

        const document = this._buildDocumentFromRevisions(existingDocumentRevisions);

        logger.info(`Saving document '${documentKey}' with revision ${document.revision}`);
        await this.documentStore.save(document, { session });
      });
    } finally {
      if (lock) {
        await this.documentLockStore.releaseLock(lock);
      }
    }
  }

  async createDocumentsBatch(user) {
    const existingActiveBatch = await this.batchStore.findOne({
      batchType: BATCH_TYPE.regenerateDocuments,
      completedOn: null
    });

    if (existingActiveBatch) {
      return null;
    }

    const batch = {
      _id: uniqueId.create(),
      createdBy: user._id,
      createdOn: new Date(),
      completedOn: null,
      batchType: BATCH_TYPE.regenerateDocuments,
      batchParams: {},
      errors: []
    };

    const allDocuments = await this.documentStore.find({});
    const tasks = allDocuments.map(document => ({
      _id: uniqueId.create(),
      batchId: batch._id,
      taskType: TASK_TYPE.regenerateDocument,
      processed: false,
      attempts: [],
      taskParams: {
        key: document.key
      }
    }));

    await this.transactionRunner.run(async session => {
      await this.batchStore.insertOne(batch, { session });
      await this.taskStore.insertMany(tasks, { session });
    });

    return batch;
  }

  _buildDocumentRevision({ data, revisionId, documentKey, userId, order, restoredFrom, sections }) {
    logger.info(`Creating new revision for document key ${documentKey} with order ${order}`);

    return {
      _id: revisionId || uniqueId.create(),
      key: documentKey,
      order,
      restoredFrom: restoredFrom || '',
      createdOn: new Date(),
      createdBy: userId || '',
      title: data.title || '',
      slug: data.slug || '',
      language: data.language || '',
      sections,
      tags: data.tags || [],
      archived: data.archived || false,
      origin: data.origin || DOCUMENT_ORIGIN.internal,
      originUrl: data.originUrl || '',
      cdnResources: this._getCdnResources(sections)
    };
  }

  _buildDocumentFromRevisions(revisions) {
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
        const info = this.infoFactory.createInfo(section.type);
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
