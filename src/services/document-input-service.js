import by from 'thenby';
import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import DocumentStore from '../stores/document-store.js';
import DocumentInputStore from '../stores/document-input-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { isRoomOwnerOrInvitedMember, isRoomOwnerOrInvitedCollaborator } from '../utils/room-utils.js';

const { BadRequest, Forbidden, NotFound } = httpErrors;

class DocumentInputService {
  static dependencies = [DocumentInputStore, DocumentStore, DocumentRevisionStore, RoomStore];

  constructor(documentInputStore, documentStore, documentRevisionStore, roomStore) {
    this.documentInputStore = documentInputStore;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
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

  async getDocumentInputsCreatedByUser(userId) {
    const documentInputs = await this.documentInputStore.getDocumentInputsCreatedByUser(userId);
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

  async createDocumentInput({ documentId, documentRevisionId, sections, user }) {
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

    const createdOn = new Date();

    const newDocumentInput = {
      _id: documentInputId,
      documentId,
      documentRevisionId,
      sections,
      createdBy: user._id,
      createdOn,
      updatedBy: user._id,
      updatedOn: createdOn
    };

    await this.documentInputStore.saveDocumentInput(newDocumentInput);
    return newDocumentInput;
  }

  async createDocumentInputSectionComment({ documentInputId, sectionKey, text, user }) {
    const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);

    if (!documentInput) {
      throw new NotFound(`Document input '${documentInputId}' not found.`);
    }

    if (!documentInput.sections[sectionKey]) {
      throw new BadRequest(`Document input '${documentInputId}' does not have a section with key '${sectionKey}'.`);
    }

    documentInput.sections[sectionKey].comments.push({
      key: uniqueId.create(),
      createdOn: new Date(),
      createdBy: user._id,
      deletedOn: null,
      deletedBy: null,
      text: text.trim()
    });

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

    await this.documentInputStore.deleteDocumentInputById(documentInputId);
  }
}

export default DocumentInputService;
