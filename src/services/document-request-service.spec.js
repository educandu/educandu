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
  let result;
  let document;
  let container;
  let documentRevision;

  const now = new Date('2024-04-04T16:00:00.000Z');
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

        result = await sut.tryRegisterDocumentReadRequest({ document, user });
      });

      it('should not create a document request', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterDocumentReadRequest({ document });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: false,
            isWriteRequest: false
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterDocumentReadRequest({ document, user });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: true,
            isWriteRequest: false
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });
    });
  });

  describe('tryRegisterDocumentWriteRequest', () => {
    describe('when the document has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });

        result = await sut.tryRegisterDocumentWriteRequest({ document, user });
      });

      it('should not create a document request', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterDocumentWriteRequest({ document });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: false,
            isWriteRequest: true
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterDocumentWriteRequest({ document, user });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: true,
            isWriteRequest: true
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
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

        result = await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision, user });
      });

      it('should not create a document request', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the document revision does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          documentRevision = await db.documentRevisions.findOne({ documentId: document._id });
          result = await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: documentRevision.documentId,
            documentRevisionId: documentRevision._id,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: false,
            isWriteRequest: false
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: documentRevision.documentId });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });

      describe('and a user is provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          documentRevision = await db.documentRevisions.findOne({ documentId: document._id });
          result = await sut.tryRegisterDocumentRevisionReadRequest({ documentRevision, user });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: documentRevision.documentId,
            documentRevisionId: documentRevision._id,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isLoggedInRequest: true,
            isWriteRequest: false
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: documentRevision.documentId });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });
    });
  });

});
