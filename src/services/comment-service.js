import by from 'thenby';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import EventStore from '../stores/event-store.js';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { checkPermissionsOnCommentCreation } from '../utils/comment-utils.js';

const logger = new Logger(import.meta.url);

const { Forbidden, NotFound } = httpErrors;

class CommentService {
  static dependencies = [CommentStore, DocumentStore, RoomStore, EventStore, TransactionRunner];

  constructor(commentStore, documentStore, roomStore, eventStore, transactionRunner) {
    this.commentStore = commentStore;
    this.documentStore = documentStore;
    this.roomStore = roomStore;
    this.eventStore = eventStore;
    this.transactionRunner = transactionRunner;
  }

  getCommentById(commentId) {
    return this.commentStore.getCommentById(commentId);
  }

  async getAllDocumentComments(documentId) {
    const comments = await this.commentStore.getAllCommentsByDocumentId(documentId);
    return comments.sort(by(comment => comment.createdOn, 'desc'));
  }

  async createComment({ data, user, silentCreation = false }) {
    const { documentId, topic, text } = data;

    let newComment;
    await this.transactionRunner.run(async session => {
      const document = await this.documentStore.getDocumentById(documentId, { session });
      if (!document) {
        throw new NotFound(`Document with ID ${documentId} does not exist`);
      }

      const room = document.roomId
        ? await this.roomStore.getRoomById(document.roomId, { session })
        : null;

      try {
        checkPermissionsOnCommentCreation({ document, room, user });
      } catch (error) {
        logger.error(error);
        throw new Forbidden(error.message);
      }

      newComment = {
        _id: uniqueId.create(),
        documentId,
        createdOn: new Date(),
        createdBy: user._id,
        deletedOn: null,
        deletedBy: null,
        topic: topic.trim(),
        text: text.trim()
      };

      await this.commentStore.saveComment(newComment, { session });
      if (!silentCreation) {
        await this.eventStore.recordDocumentCommentCreatedEvent({ comment: newComment, document, user }, { session });
      }
    });

    return newComment;
  }

  async updateCommentsTopic({ documentId, oldTopic, newTopic }) {
    await this.commentStore.updateCommentsTopic({ documentId, oldTopic, newTopic });
  }

  async deleteComment({ commentId, user }) {
    const comment = await this.commentStore.getCommentById(commentId);

    await this.commentStore.saveComment({
      ...comment,
      deletedOn: new Date(),
      deletedBy: user._id,
      text: ''
    });
  }

}

export default CommentService;
