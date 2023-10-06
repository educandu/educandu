import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import DocumentStore from '../stores/document-store.js';
import DocumentInputStore from '../stores/document-input-store.js';
import { isRoomOwnerOrInvitedMember, isRoomOwnerOrInvitedCollaborator } from '../utils/room-utils.js';

const { BadRequest, Forbidden, NotFound } = httpErrors;

class DocumentInputService {
  static dependencies = [DocumentInputStore, DocumentStore, RoomStore];

  constructor(documentInputStore, documentStore, roomStore) {
    this.documentInputStore = documentInputStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
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

  handleGetDocumentInputsCreatedByUser(userId) {
    return this.documentInputStore.getDocumentInputsCreatedByUser(userId);
  }

  async createDocumentInput({ documentId, documentRevisionId, sections, user }) {
    const documentInputId = uniqueId.create();
    const document = await this.documentStore.getDocumentById(documentId);

    if (!document) {
      throw new NotFound(`Document '${documentId}' not found.`);
    }

    if (!document.roomId) {
      throw new BadRequest('Creating document inputs for public documents is not supported.');
    }

    const room = await this.roomStore.getRoomById(document.roomId);
    if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to create document inputs for room '${room._id}'`);
    }

    const newDocumentInput = {
      _id: documentInputId,
      documentId,
      documentRevisionId,
      sections,
      createdBy: user._id,
      createdOn: new Date(),
      updatedBy: user._id,
      updatedOn: new Date()
    };

    await this.documentInputStore.saveDocumentInput(newDocumentInput);
    return newDocumentInput;
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

    await this.documentInputStore.deleteDocumentInputById(documentInputId);
  }
}

export default DocumentInputService;
