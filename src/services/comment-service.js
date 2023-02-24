import by from 'thenby';
import uniqueId from '../utils/unique-id.js';
import EventStore from '../stores/event-store.js';
import CommentStore from '../stores/comment-store.js';
import TransactionRunner from '../stores/transaction-runner.js';

class CommentService {
  static dependencies = [CommentStore, EventStore, TransactionRunner];

  constructor(commentStore, eventStore, transactionRunner) {
    this.commentStore = commentStore;
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

  async createComment({ data, user }) {
    const newComment = {
      _id: uniqueId.create(),
      documentId: data.documentId,
      createdOn: new Date(),
      createdBy: user._id,
      deletedOn: null,
      deletedBy: null,
      topic: data.topic.trim(),
      text: data.text.trim()
    };

    await this.transactionRunner.run(async session => {
      await this.commentStore.saveComment(newComment, { session });
      await this.eventStore.recordCommentCreatedEvent({ comment: newComment, user }, { session });
    });

    return newComment;
  }

  async updateCommentsTopic({ oldTopic, newTopic }) {
    await this.commentStore.updateCommentsTopic({ oldTopic, newTopic });
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
