import Database from './database.js';
import { createSandbox } from 'sinon';
import uniqueId from '../utils/unique-id.js';
import { DAY_OF_WEEK } from '../domain/constants.js';
import DocumentRequestStore from './document-request-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

describe('document-request-store', () => {
  let db;
  let sut;
  let result;
  let container;
  const sandbox = createSandbox();

  const today = new Date('2024-04-04T00:00:00.000Z');
  const yesterday = new Date('2024-04-03T00:00:00.000Z');

  beforeAll(async () => {
    container = await setupTestEnvironment();
    db = container.get(Database);
    sut = container.get(DocumentRequestStore);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(today);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getAllDocumentRequestCountersCursor', () => {
    const documentId1 = uniqueId.create();
    const documentId2 = uniqueId.create();

    beforeEach(async () => {
      await db.documentRequests.insertOne({
        _id: uniqueId.create(),
        documentId: documentId1,
        documentRevisionId: uniqueId.create(),
        isWriteRequest: false,
        isLoggedInRequest: false,
        registeredOn: yesterday,
        registeredOnDayOfWeek: DAY_OF_WEEK.monday
      });
      await db.documentRequests.insertOne({
        _id: uniqueId.create(),
        documentId: documentId1,
        documentRevisionId: uniqueId.create(),
        isWriteRequest: false,
        isLoggedInRequest: true,
        registeredOn: yesterday,
        registeredOnDayOfWeek: DAY_OF_WEEK.monday
      });
      await db.documentRequests.insertOne({
        _id: uniqueId.create(),
        documentId: documentId1,
        documentRevisionId: uniqueId.create(),
        isWriteRequest: true,
        isLoggedInRequest: true,
        registeredOn: today,
        registeredOnDayOfWeek: DAY_OF_WEEK.tuesday
      });
      await db.documentRequests.insertOne({
        _id: uniqueId.create(),
        documentId: documentId2,
        documentRevisionId: uniqueId.create(),
        isWriteRequest: false,
        isLoggedInRequest: false,
        registeredOn: today,
        registeredOnDayOfWeek: DAY_OF_WEEK.tuesday
      });
    });

    describe('called without filters', () => {
      beforeEach(async () => {
        result = await sut.getAllDocumentRequestCountersCursor().toArray();
      });

      it('should return the aggregated requests', () => {
        const document1 = result.find(r => r.documentId === documentId1);
        const document2 = result.find(r => r.documentId === documentId2);

        expect(result).toHaveLength(2);

        expect(document1).toStrictEqual({
          _id: documentId1,
          documentId: documentId1,
          totalCount: 3,
          readCount: 2,
          writeCount: 1,
          anonymousCount: 1,
          loggedInCount: 2
        });
        expect(document2).toStrictEqual({
          _id: documentId2,
          documentId: documentId2,
          totalCount: 1,
          readCount: 1,
          writeCount: 0,
          anonymousCount: 1,
          loggedInCount: 0
        });
      });
    });

    describe('called with daysOfWeek filter', () => {
      beforeEach(async () => {
        result = await sut.getAllDocumentRequestCountersCursor({ daysOfWeek: [DAY_OF_WEEK.monday] }).toArray();
      });

      it('should return the requests that match the filters, aggregated', () => {
        expect(result).toHaveLength(1);

        expect(result).toStrictEqual([{
          _id: documentId1,
          documentId: documentId1,
          totalCount: 2,
          readCount: 2,
          writeCount: 0,
          anonymousCount: 1,
          loggedInCount: 1
        }]);
      });
    });

    describe('called with registeredFrom filter', () => {
      beforeEach(async () => {
        result = await sut.getAllDocumentRequestCountersCursor({ registeredFrom: yesterday }).toArray();
      });

      it('should return the requests that match the filters, aggregated', () => {
        const document1 = result.find(r => r.documentId === documentId1);
        const document2 = result.find(r => r.documentId === documentId2);

        expect(result).toHaveLength(2);

        expect(document1).toStrictEqual({
          _id: documentId1,
          documentId: documentId1,
          totalCount: 1,
          readCount: 0,
          writeCount: 1,
          anonymousCount: 0,
          loggedInCount: 1
        });

        expect(document2).toStrictEqual({
          _id: documentId2,
          documentId: documentId2,
          totalCount: 1,
          readCount: 1,
          writeCount: 0,
          anonymousCount: 1,
          loggedInCount: 0
        });
      });
    });

    describe('called with registeredUntil filter', () => {
      beforeEach(async () => {
        result = await sut.getAllDocumentRequestCountersCursor({ registeredUntil: today }).toArray();
      });

      it('should return the requests that match the filters, aggregated', () => {
        expect(result).toHaveLength(1);

        expect(result).toStrictEqual([{
          _id: documentId1,
          documentId: documentId1,
          totalCount: 2,
          readCount: 2,
          writeCount: 0,
          anonymousCount: 1,
          loggedInCount: 1
        }]);
      });
    });
  });
});
