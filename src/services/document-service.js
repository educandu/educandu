import by from 'thenby';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import BatchStore from '../stores/batch-store.js';
import InfoFactory from '../plugins/info-factory.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import { createSectionRevision } from './section-helper.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';

const logger = new Logger(import.meta.url);

const { BadRequest, NotFound } = httpErrors;

class DocumentService {
  static get inject() {
    return [
      DocumentRevisionStore,
      DocumentOrderStore,
      DocumentStore,
      BatchStore,
      TaskStore,
      LockStore,
      TransactionRunner,
      InfoFactory
    ];
  }

  constructor(documentRevisionStore, documentOrderStore, documentStore, batchStore, taskStore, lockStore, transactionRunner, infoFactory) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentStore = documentStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.infoFactory = infoFactory;
  }

  async getAllDocumentsMetadata({ includeArchived } = {}) {
    const documentsMetadata = includeArchived
      ? await this.documentStore.getAllDocumentsExtendedMetadata()
      : await this.documentStore.getAllNonArchivedDocumentsExtendedMetadata();

    return documentsMetadata.sort(by(doc => doc.updatedBy, 'desc'));
  }

  async getDocumentsMetadataByTags(searchQuery) {
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

    const documents = await this.documentStore.getDocumentsExtendedMetadataByConditions(queryConditions);

    return documents.map(document => ({
      ...document,
      tagMatchCount: document.tags.filter(tag => positiveTokens.has(tag.toLowerCase())).length
    }));
  }

  getDocumentByKey(documentKey) {
    return this.documentStore.getDocumentByKey(documentKey);
  }

  getAllDocumentRevisionsByKey(documentKey) {
    return this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
  }

  getDocumentRevisionById(id) {
    return this.documentRevisionStore.getDocumentRevisionById(id);
  }

  getDocumentTagsMatchingText(searchString) {
    return this.documentStore.getDocumentTagsMatchingText(searchString);
  }

  async createDocument({ data, user }) {
    let lock;
    const documentKey = uniqueId.create();

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });
        if (existingDocumentRevisions.length) {
          throw new BadRequest(`Found unexpected existing revisions for document ${documentKey}`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const newRevision = this._buildDocumentRevision({
          ...data,
          _id: null,
          key: documentKey,
          createdBy: user._id,
          order: nextOrder
        });

        newDocument = this._buildDocumentFromRevisions([newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return newDocument;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async updateDocument({ documentKey, data, user }) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });
        if (!existingDocumentRevisions.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentKey}`);
        }

        const ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new BadRequest(`Document ${documentKey} cannot be updated because it is not internal`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const newRevision = this._buildDocumentRevision({
          ...cloneDeep(ancestorRevision),
          ...data,
          _id: null,
          key: documentKey,
          createdOn: null,
          createdBy: user._id,
          order: nextOrder,
          sections: data.sections?.map(section => createSectionRevision({
            section,
            ancestorSection: ancestorRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: false
          })) || cloneDeep(ancestorRevision.sections)
        });

        newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return newDocument;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  updateDocumentMetadata({ documentKey, metadata, user }) {
    const { title, description, slug, language, tags } = metadata;
    const data = { title, description, slug, language, tags };
    return this.updateDocument({ documentKey, data, user });
  }

  updateDocumentSections({ documentKey, sections, user }) {
    const data = { sections };
    return this.updateDocument({ documentKey, data, user });
  }

  updateArchivedState({ documentKey, user, archived }) {
    const data = { archived };
    return this.updateDocument({ documentKey, data, user });
  }

  async hardDeleteDocument(documentKey) {
    const document = await this.getDocumentByKey(documentKey);

    if (!document.origin.startsWith(DOCUMENT_ORIGIN.external)) {
      throw new Error(`Only external documents can be hard deleted. Document '${documentKey}' has origin '${document.origin}'`);
    }

    let lock;
    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      logger.info(`Hard deleting external document '${documentKey}'`);

      await this.transactionRunner.run(async session => {
        await this.documentStore.deleteDocumentByKey(documentKey, { session });
        await this.documentRevisionStore.deleteDocumentRevisionsByKey(documentKey, { session });
      });

    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async hardDeleteSection({ documentKey, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    let lock;
    try {

      logger.info(`Hard deleting sections with section key ${sectionKey} in documents with key ${documentKey}`);

      lock = await this.lockStore.takeDocumentLock(documentKey);

      const revisionsBeforeDelete = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);

      if (!revisionsBeforeDelete.length) {
        throw new NotFound(`Could not find existing revisions for document ${documentKey}`);
      }

      if (revisionsBeforeDelete[revisionsBeforeDelete.length - 1].origin !== DOCUMENT_ORIGIN.internal) {
        throw new BadRequest(`Document ${documentKey} cannot be updated because it is not internal`);
      }

      const revisionsAfterDelete = [];
      const revisionsToUpdateById = new Map();

      for (const originalRevision of revisionsBeforeDelete) {
        let currentRevision = originalRevision;

        for (const section of currentRevision.sections) {
          if (section.key === sectionKey && !section.deletedOn && (section.revision === sectionRevision || deleteAllRevisions)) {
            section.deletedOn = new Date();
            section.deletedBy = user._id;
            section.deletedBecause = reason;
            section.content = null;

            currentRevision = this._buildDocumentRevision({ ...currentRevision });

            revisionsToUpdateById.set(currentRevision._id, currentRevision);
          }
        }

        revisionsAfterDelete.push(currentRevision);
      }

      if (revisionsToUpdateById.size) {
        logger.info(`Hard deleting ${revisionsToUpdateById.size} sections with section key ${sectionKey} in document revisions with key ${documentKey}`);
        await this.documentRevisionStore.saveDocumentRevisions([...revisionsToUpdateById.values()]);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for key ${documentKey}`);
      }

      const latestDocument = this._buildDocumentFromRevisions(revisionsAfterDelete);

      logger.info(`Saving latest document with revision ${latestDocument.revision}`);
      await this.documentStore.saveDocument(latestDocument);
      return latestDocument;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async restoreDocumentRevision({ documentKey, revisionId, user }) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });

        const revisionToRestore = existingDocumentRevisions.find(rev => rev._id === revisionId);
        if (!revisionToRestore) {
          throw new Error(`Revision ${revisionId} is not valid`);
        }

        const ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new BadRequest(`Document ${documentKey} cannot be updated because it is not internal`);
        }

        if (revisionToRestore._id === ancestorRevision._id) {
          throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const clonedRevision = cloneDeep(revisionToRestore);
        const newRevision = this._buildDocumentRevision({
          ...clonedRevision,
          _id: null,
          key: documentKey,
          createdOn: null,
          createdBy: user._id,
          restoredFrom: revisionToRestore._id,
          order: nextOrder,
          sections: clonedRevision.sections.map(section => createSectionRevision({
            section,
            ancestorSection: ancestorRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: true
          }))
        });

        const newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async importDocumentRevisions({ documentKey, revisions, ancestorId, origin, originUrl }) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });
        const latestExistingRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (!ancestorId && latestExistingRevision) {
          throw new Error(`Found unexpected existing revisions for document '${documentKey}'`);
        }

        if (ancestorId && latestExistingRevision?._id !== ancestorId) {
          throw new Error(`Import of document '${documentKey}' expected to find revision '${ancestorId}' as the latest revision but found revision '${latestExistingRevision?._id}'`);
        }

        const nextOrders = await this.documentOrderStore.getNextOrders(revisions.length);
        const newDocumentRevisions = revisions.map((revision, index) => {
          return this._buildDocumentRevision({ ...revision, key: documentKey, order: nextOrders[index], origin, originUrl });
        });

        newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, ...newDocumentRevisions]);

        await this.documentRevisionStore.saveDocumentRevisions(newDocumentRevisions);
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async regenerateDocument(documentKey) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentKey);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(documentKey, { session });

        const document = this._buildDocumentFromRevisions(existingDocumentRevisions);

        logger.info(`Saving document '${documentKey}' with revision ${document.revision}`);
        await this.documentStore.saveDocument(document, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  _buildDocumentRevision(data) {
    const mappedSections = data.sections?.map(section => this._buildSection(section)) || [];

    return {
      _id: data._id || uniqueId.create(),
      key: data.key || uniqueId.create(),
      order: data.order || 0,
      restoredFrom: data.restoredFrom || '',
      createdOn: data.createdOn ? new Date(data.createdOn) : new Date(),
      createdBy: data.createdBy || '',
      title: data.title || '',
      description: data.description || '',
      slug: data.slug?.trim() || '',
      language: data.language || '',
      sections: mappedSections,
      tags: data.tags || [],
      archived: data.archived || false,
      origin: data.origin || DOCUMENT_ORIGIN.internal,
      originUrl: data.originUrl || '',
      cdnResources: this._getCdnResources(mappedSections)
    };
  }

  _buildSection(data) {
    return {
      key: data.key || uniqueId.create(),
      revision: data.revision || uniqueId.create(),
      deletedOn: data.deletedOn ? new Date(data.deletedOn) : null,
      deletedBy: data.deletedBy ? data.deletedBy : null,
      deletedBecause: data.deletedBecause ? data.deletedBecause : null,
      type: data.type,
      content: data.content || null
    };
  }

  _buildDocumentFromRevisions(revisions) {
    const firstRevision = revisions[0];
    const lastRevision = revisions[revisions.length - 1];
    const contributors = [...new Set(revisions.map(r => r.createdBy))];

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
      description: lastRevision.description,
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
        const info = this.infoFactory.tryCreateInfo(section.type);
        if (info && section.content) {
          info.getCdnResources(section.content)
            .forEach(resource => {
              if (resource) {
                cdnResources.add(resource);
              }
            });
        }
        return cdnResources;
      }, new Set())
    ];
  }
}

export default DocumentService;
