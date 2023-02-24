import by from 'thenby';
import uniqueId from '../utils/unique-id.js';
import CommentStore from '../stores/comment-store.js';

class CommentService {
  static dependencies = [CommentStore];

  constructor(commentStore) {
    this.commentStore = commentStore;
  }

  getCommentById(commentId) {
    return this.commentStore.getCommentById(commentId);
  }

  async getAllDocumentComments(documentId) {
    const comments = await this.commentStore.getAllCommentsByDocumentId(documentId);
    return comments.sort(by(comment => comment.createdOn, 'desc'));
  }

  async createComment({ data, user }) {
    const commentId = uniqueId.create();

    const newComment = {
      _id: commentId,
      documentId: data.documentId,
      createdOn: new Date(),
      createdBy: user._id,
      deletedOn: null,
      deletedBy: null,
      topic: data.topic.trim(),
      text: data.text.trim()
    };

    await this.commentStore.saveComment(newComment);

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
