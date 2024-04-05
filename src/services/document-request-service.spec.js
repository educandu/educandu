import { createSandbox } from 'sinon';
import Database from '../stores/database.js';
import DocumentRequestService from './document-request-service.js';
import { DAY_OF_WEEK, DOCUMENT_REQUEST_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, createTestUser, createTestDocument, createTestRoom } from '../test-helper.js';

describe('document-request-service', () => {
  let db;
  let sut;
  let user;
  let result;
  let document;
  let container;

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

  describe('tryRegisterReadRequest', () => {
    describe('when the document has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });

        result = await sut.tryRegisterReadRequest({ document, user });
      });

      it('should now create a document request', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterReadRequest({ document });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isUserLoggedIn: false,
            type: DOCUMENT_REQUEST_TYPE.read
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
          result = await sut.tryRegisterReadRequest({ document, user });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isUserLoggedIn: true,
            type: DOCUMENT_REQUEST_TYPE.read
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });
    });
  });

  describe('tryRegisterWriteRequest', () => {
    describe('when the document has a roomId', () => {
      beforeEach(async () => {
        const room = await createTestRoom(container, { ownedBy: user._id });
        document = await createTestDocument(container, user, { roomId: room._id });

        result = await sut.tryRegisterWriteRequest({ document, user });
      });

      it('should now create a document request', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the document does not have a roomId', () => {
      describe('and a user is not provided', () => {
        beforeEach(async () => {
          document = await createTestDocument(container, user, {});
          result = await sut.tryRegisterWriteRequest({ document });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isUserLoggedIn: false,
            type: DOCUMENT_REQUEST_TYPE.write
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
          result = await sut.tryRegisterWriteRequest({ document, user });
        });

        it('should create a document request', () => {
          expect(result).toEqual({
            _id: expect.stringMatching(/\w+/),
            documentId: document._id,
            documentRevisionId: document.revision,
            registeredOn: now,
            registeredOnDayOfWeek: nowDayOfWeek,
            isUserLoggedIn: true,
            type: DOCUMENT_REQUEST_TYPE.write
          });
        });

        it('should write it to the database', async () => {
          const retrievedDocumentRequest = await db.documentRequests.findOne({ documentId: document._id });;
          expect(result).toEqual(retrievedDocumentRequest);
        });
      });
    });
  });
});
