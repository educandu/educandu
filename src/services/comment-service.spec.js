import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import CommentService from './comment-service.js';
import CommentStore from '../stores/comment-store.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser } from '../test-helper.js';

describe('comment-service', () => {
  let sut;
  let user;
  let result;
  let container;
  let commentStore;

  const now = new Date();
  const sandbox = sinon.createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    commentStore = container.get(CommentStore);

    sut = container.get(CommentService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    user = await setupTestUser(container, { email: 'test@test.com', displayName: 'Test' });
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('createComment', () => {
    let documentId;

    beforeEach(async () => {
      documentId = uniqueId.create();
      result = await sut.createComment({
        data: {
          documentId,
          topic: '  comment-topic  ',
          text: '   comment-text   '
        },
        user
      });
    });

    it('should create a comment', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        documentId,
        createdOn: now,
        createdBy: user._id,
        deletedOn: null,
        deletedBy: null,
        topic: 'comment-topic',
        text: 'comment-text'
      });
    });

    it('should write it to the database', async () => {
      const retrievedComment = await commentStore.getCommentById(result._id);
      expect(result).toEqual(retrievedComment);
    });
  });

  describe('updateCommentsTopic', () => {
    let comments;
    let documentId;

    beforeEach(async () => {
      documentId = uniqueId.create();
      const comment1 = await sut.createComment({
        data: {
          documentId,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user
      });
      const comment2 = await sut.createComment({
        data: {
          documentId,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user
      });
      const comment3 = await sut.createComment({
        data: {
          documentId,
          topic: 'other-comment-topic',
          text: 'comment-text'
        },
        user
      });

      await sut.updateCommentsTopic({ oldTopic: 'comment-topic', newTopic: 'new-comment-topic' });
      comments = await Promise.all([
        commentStore.getCommentById(comment1._id),
        commentStore.getCommentById(comment2._id),
        commentStore.getCommentById(comment3._id)
      ]);
    });

    it('should update the comments with the given topic', () => {
      expect(comments[0].topic).toEqual('new-comment-topic');
      expect(comments[1].topic).toEqual('new-comment-topic');
    });
    it('should not update the comments with another topic', () => {
      expect(comments[2].topic).toEqual('other-comment-topic');
    });
  });

  describe('deleteComment', () => {
    let comment;
    let documentId;

    beforeEach(async () => {
      documentId = uniqueId.create();
      comment = await sut.createComment({
        data: {
          documentId,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user
      });

      await sut.deleteComment({ commentId: comment._id, user });
    });

    it('should soft delete the comment', async () => {
      result = await commentStore.getCommentById(comment._id);
      expect(result).toEqual({
        ...comment,
        deletedOn: now,
        deletedBy: user._id,
        text: ''
      });
    });
  });

});
