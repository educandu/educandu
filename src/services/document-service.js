import joi from 'joi';
import by from 'thenby';
import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import deepEqual from 'fast-deep-equal';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import TaskStore from '../stores/task-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import BatchStore from '../stores/batch-store.js';
import EventStore from '../stores/event-store.js';
import { isRoomOwner } from '../utils/room-utils.js';
import escapeStringRegexp from 'escape-string-regexp';
import DocumentStore from '../stores/document-store.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { createTextSearchQuery } from '../utils/query-utils.js';
import DocumentInputStore from '../stores/document-input-store.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import { getDocumentInputMediaPath } from '../utils/storage-utils.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { canRestoreDocumentRevisions } from '../utils/document-utils.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { DOCUMENT_VERIFIED_RELEVANCE_POINTS } from '../domain/constants.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import DocumentInputMediaItemStore from '../stores/document-input-media-item-store.js';
import { documentDBSchema, documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';
import { checkRevisionOnDocumentCreation, checkRevisionOnDocumentUpdate } from '../utils/revision-utils.js';
import { createSectionRevision, extractCdnResources, validateSection, validateSections } from './section-helper.js';

const logger = new Logger(import.meta.url);

const { BadRequest, Forbidden, NotFound } = httpErrors;

class DocumentService {
  static dependencies = [
    Cdn,
    DocumentRevisionStore,
    DocumentCommentStore,
    DocumentOrderStore,
    DocumentStore,
    DocumentInputStore,
    DocumentInputMediaItemStore,
    RoomStore,
    BatchStore,
    TaskStore,
    LockStore,
    TransactionRunner,
    PluginRegistry,
    EventStore
  ];

  constructor(
    cdn,
    documentRevisionStore,
    documentCommentStore,
    documentOrderStore,
    documentStore,
    documentInputStore,
    documentInputMediaItemStore,
    roomStore,
    batchStore,
    taskStore,
    lockStore,
    transactionRunner,
    pluginRegistry,
    eventStore
  ) {
    this.cdn = cdn;
    this.documentRevisionStore = documentRevisionStore;
    this.documentCommentStore = documentCommentStore;
    this.documentOrderStore = documentOrderStore;
    this.documentStore = documentStore;
    this.documentInputStore = documentInputStore;
    this.documentInputMediaItemStore = documentInputMediaItemStore;
    this.roomStore = roomStore;
    this.batchStore = batchStore;
    this.taskStore = taskStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
    this.pluginRegistry = pluginRegistry;
    this.eventStore = eventStore;
  }

  async getSearchableDocumentsCount() {
    const count = await this.documentStore.getPublicNonArchivedTaggedDocumentsCount();
    return count;
  }

  async getAllPublicDocumentsExtendedMetadata({ includeArchived } = {}) {
    const conditions = [{ roomId: null }];
    if (includeArchived === false) {
      conditions.push({ 'publicContext.archived': false });
    }
    const documentsMetadata = await this.documentStore.getDocumentsExtendedMetadataByConditions(conditions);
    return documentsMetadata.sort(by(doc => doc.updatedBy, 'desc'));
  }

  async getTopDocumentTags({ maxCount = 0 } = { maxCount: 0 }) {
    const conditions = [
      { roomId: null },
      { 'publicContext.archived': false }
    ];

    const tagMap = new Map();
    const documentsTags = await this.documentStore.getDocumentsTagsByConditions(conditions);

    for (const doc of documentsTags) {
      for (const tag of doc.tags) {
        const tagData = tagMap.get(tag) || { key: tag, frequency: 0 };
        tagData.frequency += 1;
        tagMap.set(tag, tagData);
      }
    }

    const tagsData = [...tagMap.values()];

    return tagsData
      .sort(by(tagData => tagData.frequency, 'desc'))
      .map(tagData => tagData.key)
      .slice(0, maxCount);
  }

  async getDocumentsMetadataBySlug(slug) {
    const documentsMetadata = await this.documentStore.getDocumentsMetadataBySlug(slug);
    return documentsMetadata.sort(by(doc => doc.createdOn, 'asc'));
  }

  async getPublicNonArchivedDocumentsByContributingUser(contributingUserId) {
    const documentsMetadata = await this.documentStore.getPublicNonArchivedDocumentsByContributingUser(contributingUserId);
    const sortedDocumentsMetadata = documentsMetadata
      .map(doc => {
        const userIsMidContributorOnly = doc.createdBy !== contributingUserId && doc.updatedBy !== contributingUserId;
        const userIsFirstContributor = doc.createdBy === contributingUserId;
        const userIsLastContributor = doc.updatedBy === contributingUserId;

        if (userIsMidContributorOnly) {
          doc.relevance = 0;
        }
        if (userIsFirstContributor) {
          doc.relevance = 1;
        }
        if (userIsLastContributor) {
          doc.relevance = 2;
        }
        return doc;
      })
      .sort(by(doc => doc.relevance, 'desc').thenBy(doc => doc.updatedOn, 'desc'))
      .map(doc => {
        delete doc.relevance;
        return doc;
      });

    return sortedDocumentsMetadata;
  }

  async getPublicNonArchivedDocumentsByCreatingUser(creatingUserId) {
    const documentsMetadata = await this.documentStore.getPublicNonArchivedDocumentsByCreatingUser(creatingUserId);
    return documentsMetadata.sort(by(doc => doc.updatedOn, 'desc'));
  }

  async getSearchableDocumentsMetadataByTags(searchQuery) {
    const textQuery = createTextSearchQuery(searchQuery, ['tags']);
    if (!textQuery.isValid) {
      return [];
    }

    const queryConditions = [
      { roomId: null },
      { 'publicContext.archived': false },
      textQuery.query
    ];

    const documents = await this.documentStore.getDocumentsExtendedMetadataByConditions(queryConditions);

    return documents.map(document => {
      const exactTagMatchCount = document.tags.filter(tag => textQuery.positiveTokens.has(tag.toLowerCase())).length;
      const verifiedPoints = document.publicContext.verified ? DOCUMENT_VERIFIED_RELEVANCE_POINTS : 0;
      const relevance = exactTagMatchCount + verifiedPoints;
      return { ...document, relevance };
    });
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

  getDocumentsMetadataByIds(documentIds) {
    return this.documentStore.getDocumentsMetadataByIds(documentIds);
  }

  getDocumentsExtendedMetadataByIds(documentIds) {
    return this.documentStore.getDocumentsExtendedMetadataByIds(documentIds);
  }

  getDocumentRevisionById(documentRevisionId) {
    return this.documentRevisionStore.getDocumentRevisionById(documentRevisionId);
  }

  getDocumentTagsMatchingText(searchString) {
    const sanitizedSearchString = escapeStringRegexp((searchString || '').trim());
    return this.documentStore.getDocumentTagsMatchingText(sanitizedSearchString);
  }

  async findDocumentsMetadataInSearchableDocuments({ query }) {
    const sanitizedQuery = escapeStringRegexp(query.trim());

    const queryConditions = [
      { roomId: null },
      { 'publicContext.archived': false }
    ];

    if (sanitizedQuery) {
      queryConditions.push({ title: { $regex: sanitizedQuery, $options: 'i' } });
    }

    const documentsMetadata = await this.documentStore.getDocumentsMetadataByConditions(queryConditions);

    return documentsMetadata;
  }

  async createDocument({ data, user, silentCreation = false }) {
    let roomLock;
    let documentLock;
    const documentId = uniqueId.create();

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);
      if (data.roomId) {
        roomLock = await this.lockStore.takeRoomLock(data.roomId);
      }

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (existingDocumentRevisions.length) {
          throw new BadRequest(`Found unexpected existing revisions for document ${documentId}`);
        }

        const newDocumentRevision = this._buildDocumentRevision({
          ...data,
          _id: null,
          documentId,
          createdBy: user._id
        });

        let room;
        if (newDocumentRevision.roomId) {
          room = await this.roomStore.getRoomById(newDocumentRevision.roomId, { session });
          room.documents = ensureIsIncluded(room.documents, documentId);
        } else {
          room = null;
        }

        try {
          checkRevisionOnDocumentCreation({ newRevision: newDocumentRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newDocumentRevision.order = await this.documentOrderStore.getNextOrder();
        newDocument = this._buildDocumentFromRevisions([newDocumentRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newDocumentRevision, { session });
        if (!silentCreation) {
          await this.eventStore.recordDocumentRevisionCreatedEvent({ documentRevision: newDocumentRevision, user }, { session });
        }
        await this.documentStore.saveDocument(newDocument, { session });
        if (room) {
          await this.roomStore.saveRoom(room, { session });
        }
      });

      return newDocument;
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
      if (roomLock) {
        await this.lockStore.releaseLock(roomLock);
      }
    }
  }

  async updateDocument({ documentId, data, revisionCreatedBecause, user, silentUpdate = false }) {
    let documentLock;

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);

      let newDocument;
      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });
        if (!existingDocumentRevisions.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentId}`);
        }

        const previousRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        const newDocumentRevision = this._buildDocumentRevision({
          ...cloneDeep(previousRevision),
          ...data,
          _id: null,
          documentId,
          createdOn: null,
          createdBy: user._id,
          createdBecause: revisionCreatedBecause || '',
          sections: data.sections?.map(section => createSectionRevision({
            section,
            ancestorSection: previousRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: false
          })) || cloneDeep(previousRevision.sections)
        });

        const room = newDocumentRevision.roomId ? await this.roomStore.getRoomById(newDocumentRevision.roomId, { session }) : null;

        try {
          checkRevisionOnDocumentUpdate({ previousRevision, newRevision: newDocumentRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newDocumentRevision.order = await this.documentOrderStore.getNextOrder();
        newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newDocumentRevision, { session });
        if (!silentUpdate) {
          await this.eventStore.recordDocumentRevisionCreatedEvent({ documentRevision: newDocumentRevision, user }, { session });
        }
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return newDocument;
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
    }
  }

  updateDocumentMetadata({ documentId, metadata, revisionCreatedBecause, user }) {
    return this.updateDocument({ documentId, data: metadata, revisionCreatedBecause, user });
  }

  updateDocumentSections({ documentId, sections, revisionCreatedBecause, user }) {
    const data = { sections };
    return this.updateDocument({ documentId, data, revisionCreatedBecause, user });
  }

  async hardDeletePrivateDocument({ documentId, user }) {
    let doc;
    let room;
    let roomLock;
    let documentLock;
    let documentInputIds;

    try {
      documentLock = await this.lockStore.takeDocumentLock(documentId);

      logger.info(`Hard deleting document '${documentId}'`);

      await this.transactionRunner.run(async session => {
        doc = await this.documentStore.getDocumentById(documentId, { session });
        if (!doc.roomId) {
          throw new Forbidden('Cannot delete public documents');
        }

        roomLock = await this.lockStore.takeRoomLock(doc.roomId);
        room = await this.roomStore.getRoomById(doc.roomId, { session });
        if (!isRoomOwner({ room, userId: user._id })) {
          throw new Forbidden('Only room owners can delete room documents');
        }

        const documentInputs = await this.documentInputStore.getDocumentInputsByDocumentId(documentId, { session });
        documentInputIds = documentInputs.map(input => input._id);

        room.documents = ensureIsExcluded(room.documents, doc._id);
        await this.roomStore.saveRoom(room, { session });
        await this.documentStore.deleteDocumentById(documentId, { session });
        await this.documentInputStore.deleteDocumentInputsByDocumentId(documentId, { session });
        await this.documentRevisionStore.deleteDocumentRevisionsByDocumentId(documentId, { session });
        await this.documentCommentStore.deleteDocumentCommentsByDocumentId(documentId, { session });
        await this.documentInputMediaItemStore.deleteDocumentInputMediaItemsByDocumentInputIds(documentInputIds, { session });
      });

      for (const documentInputId of documentInputIds) {
        await this.cdn.deleteDirectory({ directoryPath: getDocumentInputMediaPath({ roomId: doc.roomId, documentInputId }) });
      }
    } finally {
      if (documentLock) {
        await this.lockStore.releaseLock(documentLock);
      }
      if (roomLock) {
        await this.lockStore.releaseLock(roomLock);
      }
    }
  }

  async hardDeleteSection({ documentId, sectionKey, sectionRevision, reason, deleteAllRevisions, user }) {
    let lock;

    if (!hasUserPermission(user, permissions.DELETE_PUBLIC_CONTENT)) {
      throw new Forbidden('User is not allowed to delete document sections');
    }

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      let latestDocument;
      await this.transactionRunner.run(async session => {
        const revisionsBeforeDelete = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        if (!revisionsBeforeDelete.length) {
          throw new NotFound(`Could not find existing revisions for document ${documentId}`);
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

        latestDocument = this._buildDocumentFromRevisions(revisionsAfterDelete, { session });

        logger.info(`Saving latest document with revision ${latestDocument.revision}`);
        await this.documentStore.saveDocument(latestDocument, { session });
      });

      return latestDocument;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async restoreDocumentRevision({ documentId, revisionId, revisionRestoredBecause, user }) {
    let lock;

    const document = await this.documentStore.getDocumentById(documentId);
    const documentRoom = document?.roomId ? await this.roomStore.getRoomById(document.roomId) : null;

    if (!document) {
      throw new NotFound(`Could not find document ${documentId}`);
    }

    if (document.roomId && !documentRoom) {
      throw new NotFound(`Could not find room ${document.roomId} to which document ${documentId} belongs`);
    }

    if (!canRestoreDocumentRevisions({ user, doc: document, room: documentRoom })) {
      throw new Forbidden('User is not allowed to restore document revisions for this document');
    }

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      await this.transactionRunner.run(async session => {
        const existingDocumentRevisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId, { session });

        const revisionToRestore = existingDocumentRevisions.find(rev => rev._id === revisionId);
        if (!revisionToRestore) {
          throw new Error(`Revision ${revisionId} is not valid`);
        }

        const previousRevision = existingDocumentRevisions[existingDocumentRevisions.length - 1];

        if (revisionToRestore._id === previousRevision._id) {
          throw new Error(`Revision ${revisionId} cannot be restored, it is the latest revision`);
        }

        const clonedRevision = cloneDeep(revisionToRestore);

        const newDocumentRevision = this._buildDocumentRevision({
          ...clonedRevision,
          _id: null,
          documentId,
          createdOn: null,
          createdBy: user._id,
          createdBecause: revisionRestoredBecause || '',
          restoredFrom: revisionToRestore._id,
          sections: clonedRevision.sections.map(section => createSectionRevision({
            section,
            ancestorSection: previousRevision.sections.find(s => s.key === section.key) || null,
            isRestoreOperation: true
          }))
        });

        const room = newDocumentRevision.roomId ? await this.roomStore.getRoomById(newDocumentRevision.roomId, { session }) : null;

        try {
          checkRevisionOnDocumentUpdate({ previousRevision, newRevision: newDocumentRevision, room, user });
        } catch (error) {
          logger.error(error);
          throw new Forbidden(error.message);
        }

        newDocumentRevision.order = await this.documentOrderStore.getNextOrder();
        const newDocument = this._buildDocumentFromRevisions([...existingDocumentRevisions, newDocumentRevision]);

        await this.documentRevisionStore.saveDocumentRevision(newDocumentRevision, { session });
        await this.eventStore.recordDocumentRevisionCreatedEvent({ documentRevision: newDocumentRevision, user }, { session });
        await this.documentStore.saveDocument(newDocument, { session });
      });

      return this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
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

  async validateDocument(documentId) {
    const errorCases = [];
    const validationOptions = { abortEarly: false, convert: false, noDefaults: true };

    const doc = await this.documentStore.getDocumentById(documentId);
    try {
      joi.attempt(doc, documentDBSchema, validationOptions);
    } catch (error) {
      errorCases.push({
        ...error,
        documentId: doc._id
      });
    }

    for (const section of doc.sections) {
      try {
        validateSection(section, this.pluginRegistry);
      } catch (error) {
        errorCases.push({
          ...error,
          documentId: doc._id,
          sectionKey: section.key
        });
      }
    }

    const revisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);
    for (const revision of revisions) {
      try {
        joi.attempt(revision, documentRevisionDBSchema, validationOptions);
      } catch (error) {
        errorCases.push({
          ...error,
          documentId: doc._id
        });
      }

      for (const section of revision.sections) {
        try {
          validateSection(section, this.pluginRegistry);
        } catch (error) {
          errorCases.push({
            ...error,
            documentRevisionId: revision._id,
            sectionKey: section.key
          });
        }
      }
    }

    if (errorCases.length) {
      const err = new Error(`Error validating document with ID ${documentId}`);
      err.cases = errorCases;
      err.isIrrecoverable = true;
      throw err;
    }
  }

  async consolidateCdnResources(documentId) {
    let lock;

    try {
      lock = await this.lockStore.takeDocumentLock(documentId);

      const [existingDocumentRevisions, existingDocument] = await Promise.all([
        this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId),
        this.documentStore.getDocumentById(documentId)
      ]);

      const updatedDocumentRevisions = existingDocumentRevisions.map(revision => ({
        ...revision,
        cdnResources: extractCdnResources(revision.sections, this.pluginRegistry)
      }));

      const updatedDocument = this._buildDocumentFromRevisions(updatedDocumentRevisions);

      if (!deepEqual(existingDocumentRevisions, updatedDocumentRevisions) || !deepEqual(existingDocument, updatedDocument)) {
        await Promise.all([
          this.documentRevisionStore.saveDocumentRevisions(updatedDocumentRevisions),
          this.documentStore.saveDocument(updatedDocument)
        ]);
      }
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  _buildDocumentRevision(data) {
    const mappedSections = data.sections?.map(section => this._buildSection(section)) || [];
    validateSections(mappedSections, this.pluginRegistry);

    const archived = data.publicContext?.archived || false;
    const archiveRedirectionDocumentId = data.publicContext?.archiveRedirectionDocumentId || null;

    const publicContext = data.roomId
      ? null
      : {
        allowedEditors: data.publicContext?.allowedEditors || [],
        protected: data.publicContext?.protected || false,
        archived: data.publicContext?.archived || false,
        archiveRedirectionDocumentId: archived ? archiveRedirectionDocumentId : null,
        verified: data.publicContext?.verified || false,
        review: data.publicContext?.review || ''
      };
    const roomContext = data.roomId
      ? {
        draft: data.roomContext?.draft || false,
        inputSubmittingDisabled: data.roomContext?.inputSubmittingDisabled || false
      }
      : null;

    return {
      _id: data._id || uniqueId.create(),
      documentId: data.documentId || uniqueId.create(),
      roomId: data.roomId || null,
      order: data.order || 0,
      restoredFrom: data.restoredFrom || null,
      createdOn: data.createdOn ? new Date(data.createdOn) : new Date(),
      createdBy: data.createdBy || '',
      createdBecause: data.createdBecause || '',
      title: data.title || '',
      shortDescription: data.shortDescription || '',
      slug: data.slug?.trim() || '',
      language: data.language || '',
      sections: mappedSections,
      tags: data.tags || [],
      publicContext,
      roomContext,
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
      shortDescription: lastRevision.shortDescription,
      slug: lastRevision.slug,
      language: lastRevision.language,
      sections: lastRevision.sections,
      contributors,
      tags: lastRevision.tags,
      publicContext: cloneDeep(lastRevision.publicContext) || null,
      roomContext: cloneDeep(lastRevision.roomContext) || null,
      cdnResources: lastRevision.cdnResources
    };
  }
}

export default DocumentService;
