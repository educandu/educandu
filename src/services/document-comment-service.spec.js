import { assert, createSandbox } from 'sinon';
import EventStore from '../stores/event-store.js';
import DocumentCommentService from './document-comment-service.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, createTestUser, createTestDocument } from '../test-helper.js';

describe('document-comment-service', () => {
  let sut;
  let user;
  let result;
  let container;
  let eventStore;
  let documentCommentStore;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    eventStore = container.get(EventStore);
    documentCommentStore = container.get(DocumentCommentStore);
    sut = container.get(DocumentCommentService);
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

  describe('createDocumentComment', () => {
    let document;

    beforeEach(async () => {
      sandbox.stub(eventStore, 'recordDocumentCommentCreatedEvent').resolves();

      document = await createTestDocument(container, user, {});

      result = await sut.createDocumentComment({
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
      const retrievedComment = await documentCommentStore.getDocumentCommentById(result._id);
      expect(result).toEqual(retrievedComment);
    });

    it('should create an event', () => {
      assert.calledOnce(eventStore.recordDocumentCommentCreatedEvent);
    });
  });

  describe('updateDocumentCommentsTopic', () => {
    let comments;
    let document;
    let otherDocument;

    beforeEach(async () => {
      document = await createTestDocument(container, user, {});
      otherDocument = await createTestDocument(container, user, {});

      const comment1 = await sut.createDocumentComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment2 = await sut.createDocumentComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment3 = await sut.createDocumentComment({
        data: {
          documentId: document._id,
          topic: 'other-comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });
      const comment4 = await sut.createDocumentComment({
        data: {
          documentId: otherDocument._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });

      await sut.updateDocumentCommentsTopic({ documentId: document._id, oldTopic: 'comment-topic', newTopic: 'new-comment-topic' });
      comments = await Promise.all([
        documentCommentStore.getDocumentCommentById(comment1._id),
        documentCommentStore.getDocumentCommentById(comment2._id),
        documentCommentStore.getDocumentCommentById(comment3._id),
        documentCommentStore.getDocumentCommentById(comment4._id)
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

  describe('deleteDocumentComment', () => {
    let document;
    let comment;

    beforeEach(async () => {
      document = await createTestDocument(container, user, {});

      comment = await sut.createDocumentComment({
        data: {
          documentId: document._id,
          topic: 'comment-topic',
          text: 'comment-text'
        },
        user,
        silentCreation: true
      });

      await sut.deleteDocumentComment({ documentCommentId: comment._id, user });
    });

    it('should soft delete the comment', async () => {
      result = await documentCommentStore.getDocumentCommentById(comment._id);
      expect(result).toEqual({
        ...comment,
        deletedOn: now,
        deletedBy: user._id,
        text: ''
      });
    });
  });

});
