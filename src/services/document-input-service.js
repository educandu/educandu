import by from 'thenby';
import mime from 'mime';
import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import RoomStore from '../stores/room-store.js';
import UserStore from '../stores/user-store.js';
import LockStore from '../stores/lock-store.js';
import EventStore from '../stores/event-store.js';
import DocumentStore from '../stores/document-store.js';
import { getResourceType } from '../utils/resource-utils.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentInputStore from '../stores/document-input-store.js';
import RoomMediaItemStore from '../stores/room-media-item-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE } from '../domain/constants.js';
import DocumentInputMediaItemStore from '../stores/document-input-media-item-store.js';
import { createDocumentInputUploadedFileName } from '../utils/document-input-utils.js';
import { isRoomOwnerOrInvitedMember, isRoomOwnerOrInvitedCollaborator, isRoomOwner } from '../utils/room-utils.js';
import { createUniqueStorageFileName, getDocumentInputMediaPath, getPrivateStorageOverview } from '../utils/storage-utils.js';

const { BadRequest, Forbidden, NotFound } = httpErrors;

class DocumentInputService {
  static dependencies = [
    DocumentInputStore,
    DocumentStore,
    DocumentRevisionStore,
    RoomStore,
    RoomMediaItemStore,
    DocumentInputMediaItemStore,
    UserStore,
    StoragePlanStore,
    LockStore,
    Cdn,
    EventStore,
    TransactionRunner
  ];

  constructor(
    documentInputStore,
    documentStore,
    documentRevisionStore,
    roomStore,
    roomMediaItemStore,
    documentInputMediaItemStore,
    userStore,
    storagePlanStore,
    lockStore,
    cdn,
    eventStore,
    transactionRunner
  ) {
    this.documentInputStore = documentInputStore;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
    this.roomStore = roomStore;
    this.roomMediaItemStore = roomMediaItemStore;
    this.documentInputMediaItemStore = documentInputMediaItemStore;
    this.userStore = userStore;
    this.storagePlanStore = storagePlanStore;
    this.lockStore = lockStore;
    this.cdn = cdn;
    this.eventStore = eventStore;
    this.transactionRunner = transactionRunner;
  }

  async getDocumentInputById({ documentInputId, user }) {
    const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);

    if (!documentInput) {
      throw new NotFound(`Document input '${documentInputId}' not found.`);
    }

    const document = await this.documentStore.getDocumentById(documentInput.documentId);
    if (!document) {
      throw new NotFound(`Document '${documentInput.documentId}' not found.`);
    }

    const room = await this.roomStore.getRoomById(document.roomId);
    if (documentInput.createdBy !== user._id && !isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to view document input '${documentInputId}'`);
    }

    return documentInput;
  }

  async getAllDocumentInputsCreatedByUser(userId) {
    const documentInputs = await this.documentInputStore.getAllDocumentInputsCreatedByUser(userId);
    return documentInputs.sort(by(input => input.createdOn, 'desc'));
  }

  async getDocumentInputsByDocumentId(documentId) {
    const documentInputs = await this.documentInputStore.getDocumentInputsByDocumentId(documentId);
    return documentInputs.sort(by(input => input.createdOn, 'desc'));
  }

  async getDocumentInputsByRoomId(roomId) {
    const room = await this.roomStore.getRoomById(roomId);

    const documentInputs = await this.documentInputStore.getDocumentInputsByDocumentIds(room.documents);
    return documentInputs.sort(by(input => input.createdOn, 'desc'));
  }

  async createDocumentInput({ documentId, documentRevisionId, sections, files, user, silentCreation }) {
    let lock;
    try {
      const documentInputId = uniqueId.create();
      const documentRevision = await this.documentRevisionStore.getDocumentRevisionById(documentRevisionId);

      if (!documentRevision) {
        throw new NotFound(`Document '${documentId}' not found.`);
      }

      if (documentRevision.documentId !== documentId) {
        throw new BadRequest(`Document revision ${documentRevisionId} is not a revision of document '${documentId}'.`);
      }

      if (!documentRevision.roomId) {
        throw new BadRequest('Creating document inputs for public documents is not supported.');
      }

      if (documentRevision.roomContext.inputSubmittingDisabled) {
        throw new BadRequest('Creating document inputs for this document revision is not supported.');
      }

      const room = await this.roomStore.getRoomById(documentRevision.roomId);
      if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to create document inputs for room '${room._id}'`);
      }

      const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.findActiveUserById(room.ownedBy);
      if (files.length && !roomOwner.storage.planId) {
        throw new BadRequest('Cannot upload to room-media storage without a storage plan');
      }

      let totalRequiredSize = 0;
      const now = new Date();
      const newCdnFiles = [];
      const newDocumentInputMediaItems = [];
      const finalSections = cloneDeep(sections);
      for (const [sectionKey, section] of Object.entries(finalSections)) {
        for (const sectionFile of section.files) {
          const uploadedFileName = createDocumentInputUploadedFileName(sectionKey, sectionFile.key);
          const uploadedFile = files.find(file => file.originalname === uploadedFileName);
          if (!uploadedFile) {
            throw new BadRequest(`File with key ${sectionFile.key} is referenced in section but was not uploaded`);
          }

          const storageFileName = createUniqueStorageFileName(sectionFile.name);
          const storagePath = urlUtils.concatParts(getDocumentInputMediaPath({ roomId: room._id, documentInputId }), storageFileName);
          const storageUrl = `${CDN_URL_PREFIX}${storagePath}`;

          const resourceType = getResourceType(storageUrl);
          const contentType = mime.getType(storageUrl) || DEFAULT_CONTENT_TYPE;
          const size = uploadedFile.size;

          totalRequiredSize += size;

          newCdnFiles.push({ sourceKey: uploadedFile.key, storagePath });

          newDocumentInputMediaItems.push({
            _id: uniqueId.create(),
            roomId: room._id,
            documentInputId,
            resourceType,
            contentType,
            size,
            createdBy: user._id,
            createdOn: now,
            url: storageUrl,
            name: storageFileName
          });

          Object.assign(sectionFile, {
            name: storageFileName,
            size,
            type: contentType,
            url: storageUrl
          });
        }
      }

      const newDocumentInput = {
        _id: documentInputId,
        documentId,
        documentRevisionId,
        createdBy: user._id,
        createdOn: now,
        updatedBy: user._id,
        updatedOn: now,
        sections: finalSections
      };

      if (newCdnFiles.length) {
        lock = await this.lockStore.takeUserLock(room.ownedBy);

        const storagePlan = await this.storagePlanStore.getStoragePlanById(roomOwner.storage.planId);
        const availableBytes = storagePlan.maxBytes - roomOwner.storage.usedBytes;
        if (availableBytes < totalRequiredSize) {
          throw new BadRequest(`Not enough storage space: available ${prettyBytes(availableBytes)}, required ${prettyBytes(totalRequiredSize)}`);
        }

        for (const newCdnFile of newCdnFiles) {
          await this.cdn.moveObject(newCdnFile.sourceKey, newCdnFile.storagePath);
        }

        for (const newDocumentInputMediaItem of newDocumentInputMediaItems) {
          await this.documentInputMediaItemStore.insertDocumentInputMediaItem(newDocumentInputMediaItem);
        }

        const overview = await getPrivateStorageOverview({
          user: roomOwner,
          roomStore: this.roomStore,
          storagePlanStore: this.storagePlanStore,
          roomMediaItemStore: this.roomMediaItemStore,
          documentInputMediaItemStore: this.documentInputMediaItemStore
        });

        const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes: overview.usedBytes });
        Object.assign(roomOwner, updatedUser);
      }

      if (!silentCreation) {
        await this.eventStore.recordDocumentInputCreatedEvent({ documentInput: newDocumentInput, room, user });
      }

      await this.documentInputStore.saveDocumentInput(newDocumentInput);

      return newDocumentInput;
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async createDocumentInputSectionComment({ documentInputId, sectionKey, text, user, silentCreation }) {
    const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);

    if (!documentInput) {
      throw new NotFound(`Document input '${documentInputId}' not found.`);
    }

    if (!documentInput.sections[sectionKey]) {
      throw new BadRequest(`Document input '${documentInputId}' does not have a section with key '${sectionKey}'.`);
    }

    const document = await this.documentStore.getDocumentById(documentInput.documentId);
    if (!document) {
      throw new NotFound(`Document '${documentInput.documentId}' not found.`);
    }

    const room = await this.roomStore.getRoomById(document.roomId);
    if (documentInput.createdBy !== user._id && !isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to post comment on document input '${documentInputId}'`);
    }

    const newComment = {
      key: uniqueId.create(),
      createdOn: new Date(),
      createdBy: user._id,
      deletedOn: null,
      deletedBy: null,
      text: text.trim()
    };
    documentInput.sections[sectionKey].comments.push(newComment);

    if (!silentCreation) {
      await this.eventStore.recordDocumentInputCommentCreatedEvent({ documentInput, commentKey: newComment.key, room, user });
    }

    await this.documentInputStore.saveDocumentInput(documentInput);

    return documentInput;
  }

  async deleteDocumentInputSectionComment({ documentInputId, sectionKey, commentKey, user }) {
    const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);

    if (!documentInput) {
      throw new NotFound(`Document input '${documentInputId}' not found.`);
    }

    if (!documentInput.sections[sectionKey]) {
      throw new BadRequest(`Document input '${documentInputId}' does not have a section with key '${sectionKey}'.`);
    }

    const document = await this.documentStore.getDocumentById(documentInput.documentId);
    if (!document) {
      throw new NotFound(`Document '${documentInput.documentId}' not found.`);
    }

    const room = await this.roomStore.getRoomById(document.roomId);
    if (documentInput.createdBy !== user._id && !isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to post comment on document input '${documentInputId}'`);
    }

    const deletedComment = documentInput.sections[sectionKey].comments.find(comment => comment.key === commentKey);
    deletedComment.deletedOn = new Date();
    deletedComment.deletedBy = user._id;
    deletedComment.text = '';

    await this.documentInputStore.saveDocumentInput(documentInput);
    return documentInput;
  }

  async hardDeleteDocumentInput({ documentInputId, user }) {
    const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);

    if (!documentInput) {
      throw new NotFound(`Document input '${documentInputId}' not found.`);
    }

    const document = await this.documentStore.getDocumentById(documentInput.documentId);
    if (!document) {
      throw new NotFound(`Document '${documentInput.documentId}' not found.`);
    }

    const room = await this.roomStore.getRoomById(document.roomId);
    if (documentInput.createdBy !== user._id && !isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to delete document input '${documentInputId}'`);
    }

    await this.transactionRunner.run(async session => {
      await this.documentInputMediaItemStore.deleteDocumentInputMediaItemsByDocumentInputId(documentInputId, { session });
      await this.documentInputStore.deleteDocumentInputById(documentInputId, { session });
    });

    await this.cdn.deleteDirectory({ directoryPath: getDocumentInputMediaPath({ roomId: room._id, documentInputId }) });
  }
}

export default DocumentInputService;
