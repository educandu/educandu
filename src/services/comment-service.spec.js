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

  describe('updateComment', () => {
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

      result = await sut.updateComment({ commentId: comment._id, topic: 'new-comment-topic' });
    });

    it('should update the comment', () => {
      expect(result).toEqual({
        ...comment,
        topic: 'new-comment-topic'
      });
    });

    it('should write it to the database', async () => {
      const retrievedComment = await commentStore.getCommentById(comment._id);
      expect(result).toEqual(retrievedComment);
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
        text: null
      });
    });
  });

});
