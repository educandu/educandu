import by from 'thenby';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import EventStore from '../stores/event-store.js';
import DocumentStore from '../stores/document-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import { checkPermissionsOnDocumentCommentCreation } from '../utils/document-comment-utils.js';

const logger = new Logger(import.meta.url);

const { Forbidden, NotFound } = httpErrors;

class DocumentCommentService {
  static dependencies = [DocumentCommentStore, DocumentStore, RoomStore, EventStore, TransactionRunner];

  constructor(documentCommentStore, documentStore, roomStore, eventStore, transactionRunner) {
    this.documentCommentStore = documentCommentStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
    this.eventStore = eventStore;
    this.transactionRunner = transactionRunner;
  }

  getDocumentCommentById(documentCommentId) {
    return this.documentCommentStore.getDocumentCommentById(documentCommentId);
  }

  async getAllDocumentComments(documentId) {
    const comments = await this.documentCommentStore.getAllDocumentCommentsByDocumentId(documentId);
    return comments.sort(by(comment => comment.createdOn, 'desc'));
  }

  async createDocumentComment({ data, user, silentCreation = false }) {
    const { documentId, topic, text } = data;

    let newDocumentComment;
    await this.transactionRunner.run(async session => {
      const document = await this.documentStore.getDocumentById(documentId, { session });
      if (!document) {
        throw new NotFound(`Document with ID ${documentId} does not exist`);
      }

      const room = document.roomId
        ? await this.roomStore.getRoomById(document.roomId, { session })
        : null;

      try {
        checkPermissionsOnDocumentCommentCreation({ document, room, user });
      } catch (error) {
        logger.error(error);
        throw new Forbidden(error.message);
      }

      newDocumentComment = {
        _id: uniqueId.create(),
        documentId,
        createdOn: new Date(),
        createdBy: user._id,
        deletedOn: null,
        deletedBy: null,
        topic: topic.trim(),
        text: text.trim()
      };

      await this.documentCommentStore.saveDocumentComment(newDocumentComment, { session });
      if (!silentCreation) {
        await this.eventStore.recordDocumentCommentCreatedEvent({ documentComment: newDocumentComment, document, user }, { session });
      }
    });

    return newDocumentComment;
  }

  async updateDocumentCommentsTopic({ documentId, oldTopic, newTopic }) {
    await this.documentCommentStore.updateDocumentCommentsTopic({ documentId, oldTopic, newTopic });
  }

  async deleteDocumentComment({ documentCommentId, user }) {
    const documentComment = await this.documentCommentStore.getDocumentCommentById(documentCommentId);

    await this.documentCommentStore.saveDocumentComment({
      ...documentComment,
      deletedOn: new Date(),
      deletedBy: user._id,
      text: ''
    });
  }

}

export default DocumentCommentService;
