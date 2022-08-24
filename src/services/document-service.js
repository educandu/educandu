import by from 'thenby';
import httpErrors from 'http-errors';
import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import Cdn from '../repositories/cdn.js';
import urlUtils from '../utils/url-utils.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import BatchStore from '../stores/batch-store.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { getPublicHomePath } from '../utils/storage-utils.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { createSectionRevision, extractCdnResources } from './section-helper.js';
import { ALLOWED_OPEN_CONTRIBUTION, DOCUMENT_ORIGIN, STORAGE_DIRECTORY_MARKER_NAME } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const { BadRequest, NotFound } = httpErrors;

class DocumentService {
  static get inject() {
    return [
      Cdn,
      DocumentRevisionStore,
      DocumentOrderStore,
      DocumentStore,
      RoomStore,
      BatchStore,
      TaskStore,
      LockStore,
      TransactionRunner,
      PluginRegistry
    ];
  }

  // eslint-disable-next-line max-params
  constructor(cdn, documentRevisionStore, documentOrderStore, documentStore, roomStore, batchStore, taskStore, lockStore, transactionRunner, pluginRegistry) {
    this.cdn = cdn;
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.pluginRegistry = pluginRegistry;
  }

  async getAllPublicDocumentsMetadata({ includeArchived } = {}) {
    const conditions = [{ roomId: null }];
    if (includeArchived === false) {
      conditions.push({ archived: false });
    }
    const documentsMetadata = await this.documentStore.getDocumentsExtendedMetadataByConditions(conditions);
    return documentsMetadata.sort(by(doc => doc.updatedBy, 'desc'));
  }

  async getDocumentsMetadataBySlug(slug) {
    const documentsMetadata = await this.documentStore.getDocumentsMetadataBySlug(slug);
    return documentsMetadata.sort(by(doc => doc.createdOn, 'asc'));
  }

  async getMetadataOfLatestPublicDocumentsCreatedByUser(createdBy) {
    const documentsMetadata = await this.documentStore.getPublicDocumentsMetadataByCreatedBy(createdBy);
    return documentsMetadata.sort(by(doc => doc.createdOn, 'desc'));
  }

  async getSearchableDocumentsMetadataByTags(searchQuery) {
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
      { roomId: null },
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

  getDocumentById(documentId) {
    return this.documentStore.getDocumentById(documentId);
  }

  getAllDocumentRevisionsByDocumentId(documentId) {
    return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
  }

  getDocumentsMetadataByRoomId(roomId) {
    return this.documentStore.getDocumentsMetadataByRoomId(roomId);
  }

  getDocumentRevisionById(documentRevisionId) {
    return this.documentRevisionStore.getDocumentRevisionById(documentRevisionId);
  }

  getDocumentTagsMatchingText(searchString) {
    return this.documentStore.getDocumentTagsMatchingText(searchString);
  }

  async findDocumentsMetadataInSearchableDocuments(query) {
    const sanitizedQuery = escapeStringRegexp(query.trim());

    const queryConditions = [
      { archived: false },
      { roomId: null },
      { title: { $regex: sanitizedQuery, $options: 'i' } }
    ];

    const documentsMetadata = await this.documentStore.getDocumentsMetadataByConditions(queryConditions);

    return documentsMetadata;
  }

  async createDocument({ data, user }) {
    let lock;
    const documentId = uniqueId.create();

    await this.createUploadDirectoryMarkerForDocument(documentId);

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (existingDocumentRevisions.length) {
          throw new BadRequest(`Found unexpected existing revisions for document ${documentId}`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const newRevision = this._buildDocumentRevision({
          ...data,
          _id: null,
          documentId,
          createdBy: user._id,
          order: nextOrder
        });

        newDocument = this._buildDocumentFromRevisions([newRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newRevision, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return newDocument;
    } catch (error) {
      await this.deleteUploadDirectoryMarkerForDocument(documentId);
      throw error;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async updateDocument({ documentId, data, user }) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (!existingDocumentRevisions.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentId}`);
        }

        const ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new BadRequest(`Document ${documentId} cannot be updated because it is not internal`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const newRevision = this._buildDocumentRevision({
          ...cloneDeep(ancestorRevision),
          ...data,
          _id: null,
          documentId,
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

  updateDocumentMetadata({ documentId, metadata, user }) {
    return this.updateDocument({ documentId, data: metadata, user });
  }

  updateDocumentSections({ documentId, sections, user }) {
    const data = { sections };
    return this.updateDocument({ documentId, data, user });
  }

  updateArchivedState({ documentId, user, archived }) {
    const data = { archived };
    return this.updateDocument({ documentId, data, user });
  }

  async hardDeleteDocument(documentId) {
    let lock;
    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      logger.info(`Hard deleting external document '${documentId}'`);

      await this.transactionRunner.run(async session => {
        await this.documentStore.deleteDocumentById(documentId, { session });
        await this.documentRevisionStore.deleteDocumentRevisionsByDocumentId(documentId, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    let lock;
    try {

      logger.info(`Hard deleting sections with section key ${sectionKey} in documents with id ${documentId}`);

      lock = await this.lockStore.takeDocumentLock(documentId);

      const revisionsBeforeDelete = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);

      if (!revisionsBeforeDelete.length) {
        throw new NotFound(`Could not find existing revisions for document ${documentId}`);
      }

      if (revisionsBeforeDelete[revisionsBeforeDelete.length - 1].origin !== DOCUMENT_ORIGIN.internal) {
        throw new BadRequest(`Document ${documentId} cannot be updated because it is not internal`);
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
        logger.info(`Hard deleting ${revisionsToUpdateById.size} sections with section key ${sectionKey} in document revisions with documentId ${documentId}`);
        await this.documentRevisionStore.saveDocumentRevisions([...revisionsToUpdateById.values()]);
      } else {
        throw new Error(`Could not find a section with key ${sectionKey} and revision ${sectionRevision} in document revisions for documentId ${documentId}`);
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

  async restoreDocumentRevision({ documentId, revisionId, user }) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        const revisionToRestore = existingDocumentRevisions.find(rev => rev._id === revisionId);
        if (!revisionToRestore) {
          throw new Error(`Revision ${revisionId} is not valid`);
        }

        const ancestorRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];
        if (ancestorRevision.origin !== DOCUMENT_ORIGIN.internal) {
          throw new BadRequest(`Document ${documentId} cannot be updated because it is not internal`);
        }

        if (revisionToRestore._id === ancestorRevision._id) {
          throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
        }

        const nextOrder = await this.documentOrderStore.getNextOrder();
        const clonedRevision = cloneDeep(revisionToRestore);
        const newRevision = this._buildDocumentRevision({
          ...clonedRevision,
          _id: null,
          documentId,
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

      return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async importDocumentRevisions({ documentId, revisions, ancestorId, origin, originUrl }) {
    let lock;

    await this.createUploadDirectoryMarkerForDocument(documentId);

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        const latestExistingRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (!ancestorId && latestExistingRevision) {
          throw new Error(`Found unexpected existing revisions for document '${documentId}'`);
        }

        if (ancestorId && latestExistingRevision?._id !== ancestorId) {
          throw new Error(`Import of document '${documentId}' expected to find revision '${ancestorId}' as the latest revision but found revision '${latestExistingRevision?._id}'`);
        }

        const nextOrders = await this.documentOrderStore.getNextOrders(revisions.length);
        const newDocumentRevisions = revisions.map((revision, index) => {
          return this._buildDocumentRevision({ ...revision, documentId, order: nextOrders[index], origin, originUrl });
        });

        newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, ...newDocumentRevisions]);

        await this.documentRevisionStore.saveDocumentRevisions(newDocumentRevisions);
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
    } catch (error) {
      if (!ancestorId) {
        await this.deleteUploadDirectoryMarkerForDocument(documentId);
      }
      throw error;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async regenerateDocument(documentId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        const document = this._buildDocumentFromRevisions(existingDocumentRevisions);

        logger.info(`Saving document '${documentId}' with revision ${document.revision}`);
        await this.documentStore.saveDocument(document, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async consolidateCdnResources(documentId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const [existingDocumentRevisions, existingDocument] = await Promise.all([
          this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session }),
          this.documentStore.getDocumentById(documentId, { session })
        ]);

        const updatedDocumentRevisions = existingDocumentRevisions.map(revision => ({
          ...revision,
          cdnResources: extractCdnResources(revision.sections, this.pluginRegistry)
        }));

        const updatedDocument = this._buildDocumentFromRevisions(updatedDocumentRevisions);

        if (!deepEqual(existingDocumentRevisions, updatedDocumentRevisions) || !deepEqual(existingDocument, updatedDocument)) {
          await Promise.all([
            this.documentRevisionStore.saveDocumentRevisions(updatedDocumentRevisions, { session }),
            this.documentStore.saveDocument(updatedDocument, { session })
          ]);
        }
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async createUploadDirectoryMarkerForDocument(documentId) {
    const homePath = getPublicHomePath(documentId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.uploadEmptyObject(directoryMarkerPath);
  }

  async deleteUploadDirectoryMarkerForDocument(documentId) {
    const homePath = getPublicHomePath(documentId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.deleteObject(directoryMarkerPath);
  }

  _buildDocumentRevision(data) {
    const mappedSections = data.sections?.map(section => this._buildSection(section)) || [];

    return {
      _id: data._id || uniqueId.create(),
      documentId: data.documentId || uniqueId.create(),
      roomId: data.roomId || null,
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
      review: data.review || '',
      verified: data.verified || false,
      allowedOpenContribution: data.allowedOpenContribution || ALLOWED_OPEN_CONTRIBUTION.metadataAndContent,
      archived: data.archived || false,
      origin: data.origin || DOCUMENT_ORIGIN.internal,
      originUrl: data.originUrl || '',
      cdnResources: extractCdnResources(mappedSections, this.pluginRegistry)
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
      _id: lastRevision.documentId,
      roomId: lastRevision.roomId,
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
      review: lastRevision.review,
      verified: lastRevision.verified,
      allowedOpenContribution: lastRevision.allowedOpenContribution,
      archived: lastRevision.archived,
      origin: lastRevision.origin,
      originUrl: lastRevision.originUrl,
      cdnResources: lastRevision.cdnResources
    };
  }
}

export default DocumentService;
