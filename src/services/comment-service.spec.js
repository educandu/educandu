import { assert, createSandbox } from 'sinon';
import CommentService from './comment-service.js';
import EventStore from '../stores/event-store.js';
import CommentStore from '../stores/comment-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, createTestUser, createTestDocument } from '../test-helper.js';

describe('comment-service', () => {
  let sut;
  let user;
  let result;
  let container;
  let eventStore;
  let commentStore;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    eventStore = container.get(EventStore);
    commentStore = container.get(CommentStore);
    sut = container.get(CommentService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);
    user = await createTestUser(container, { email: 'test@test.com', displayName: 'Test' });
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('createComment', () => {
    let document;

    beforeEach(async () => {
      sandbox.stub(eventStore, 'recordCommentCreatedEvent').resolves();

      document = await createTestDocument(container, user, {});

      result = await sut.createComment({
        data: {
          documentId: document._id,
          topic: '  comment-topic  ',
          text: '   comment-text   '
        },
        user
      });
    });

    it('should create a comment', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        documentId: document._id,
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

    it('should create an event', () => {
      assert.calledOnce(eventStore.recordCommentCreatedEvent);
    });
  });

  describe('updateCommentsTopic', () => {
    let comments;
    let document;
    let otherDocument;

    beforeEach(async () => {
      document = await createTestDocument(container, user, {});
      otherDocument = await createTestDocument(container, user, {});

      const comment1 = await sut.createComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment2 = await sut.createComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment3 = await sut.createComment({
        data: {
          documentId: document._id,
          topic: 'other-comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment4 = await sut.createComment({
        data: {
          documentId: otherDocument._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });

      await sut.updateCommentsTopic({ documentId: document._id, oldTopic: 'comment-topic', newTopic: 'new-comment-topic' });
      comments = await Promise.all([
        commentStore.getCommentById(comment1._id),
        commentStore.getCommentById(comment2._id),
        commentStore.getCommentById(comment3._id),
        commentStore.getCommentById(comment4._id)
      ]);
    });

    it('should update the comments with the given topic in the same document', () => {
      expect(comments[0].topic).toEqual('new-comment-topic');
      expect(comments[1].topic).toEqual('new-comment-topic');
    });
    it('should not update the comments with another topic in the same document', () => {
      expect(comments[2].topic).toEqual('other-comment-topic');
    });
    it('should not update the comments with given topic in another document', () => {
      expect(comments[3].topic).toEqual('comment-topic');
    });
  });

  describe('deleteComment', () => {
    let document;
    let comment;

    beforeEach(async () => {
      document = await createTestDocument(container, user, {});

      comment = await sut.createComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
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
