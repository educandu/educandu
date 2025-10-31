import { ObjectId } from 'mongodb';
import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import { DAY_OF_WEEK } from '../domain/constants.js';
import DocumentRequestService from './document-request-service.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, createTestUser, createTestDocument, createTestRoom } from '../test-helper.js';

describe('document-request-service', () => {
  let db;
  let sut;
  let user;
  let document;
  let container;
  let documentRevision;

  const now = new Date('2024-04-04T16:00:00.000Z');
  const nowDay = 20240404;
  const nowDayOfWeek = DAY_OF_WEEK.thursday;

  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    db = container.get(Database);
    sut = container.get(DocumentRequestService);
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

  describe('tryRegisterDocumentReadRequest', () => {
    describe('when the document has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });

        await sut.tryRegisterDocumentReadRequest({ document, user });
      });

      it('should not create a document request', async () => {
        const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
        expect(counter).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          await sut.tryRegisterDocumentReadRequest({ document });
        });

        it('should increment anonymous read counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: document._id,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 1,
            writeCount: 0,
            anonymousCount: 1,
            loggedInCount: 0
          });
        });

        it('should increment counters on repeated calls', async () => {
          await sut.tryRegisterDocumentReadRequest({ document });
          const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            totalCount: 2,
            readCount: 2,
            writeCount: 0,
            anonymousCount: 2,
            loggedInCount: 0
          });
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          await sut.tryRegisterDocumentReadRequest({ document, user });
        });

        it('should increment logged-in read counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: document._id,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 1,
            writeCount: 0,
            anonymousCount: 0,
            loggedInCount: 1
          });
        });
      });
    });
  });

  describe('tryRegisterDocumentWriteRequest', () => {
    describe('when the document has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });

        await sut.tryRegisterDocumentWriteRequest({ document, user });
      });

      it('should not create a document request', async () => {
        const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
        expect(counter).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          await sut.tryRegisterDocumentWriteRequest({ document });
        });

        it('should increment anonymous write counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: document._id,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 0,
            writeCount: 1,
            anonymousCount: 1,
            loggedInCount: 0
          });
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          await sut.tryRegisterDocumentWriteRequest({ document, user });
        });

        it('should increment logged-in write counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: document._id,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 0,
            writeCount: 1,
            anonymousCount: 0,
            loggedInCount: 1
          });
        });
      });
    });
  });

  describe('tryRegisterDocumentRevisionReadRequest', () => {
    describe('when the document revision has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });
        documentRevision = await db.documentRevisions.findOne({ documentId: document._id });

        await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision, user });
      });

      it('should not create a document request', async () => {
        const counter = await db.documentRequests.findOne({ documentId: document._id, day: nowDay, dayOfWeek: nowDayOfWeek });
        expect(counter).toEqual(null);
      });
    });

    describe('when the document revision does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          documentRevision = await db.documentRevisions.findOne({ documentId: document._id });
          await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision });
        });

        it('should increment anonymous read counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: documentRevision.documentId, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: documentRevision.documentId,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 1,
            writeCount: 0,
            anonymousCount: 1,
            loggedInCount: 0
          });
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          documentRevision = await db.documentRevisions.findOne({ documentId: document._id });
          await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision, user });
        });

        it('should increment logged-in read counters', async () => {
          const counter = await db.documentRequests.findOne({ documentId: documentRevision.documentId, day: nowDay, dayOfWeek: nowDayOfWeek });
          expect(counter).toMatchObject({
            _id: expect.any(ObjectId),
            documentId: documentRevision.documentId,
            day: nowDay,
            dayOfWeek: nowDayOfWeek,
            totalCount: 1,
            readCount: 1,
            writeCount: 0,
            anonymousCount: 0,
            loggedInCount: 1
          });
        });
      });
    });
  });

});
