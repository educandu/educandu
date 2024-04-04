import Database from './database.js';
import { createSandbox } from 'sinon';
import DocumentRatingStore from './document-rating-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

describe('document-rating-store', () => {
  let db;
  let sut;
  let container;
  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    db = container.get(Database);
    sut = container.get(DocumentRatingStore);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createOrUpdateUserDocumentRating', () => {
    let dbRecordBeforeUpdate;
    let dbRecordAfterUpdate;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';
    const rating = 3;
    const timestamp = new Date();

    describe('when there is no DB record for the specified document', () => {
      beforeEach(async () => {
        await sut.createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should create a new record with the correct values', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          _id: expect.any(String),
          documentId,
          userRatings: [{ userId, rating, timestamp }],
          userRatingsCount: 1,
          averageRating: rating
        });
      });
    });

    describe('when there is a DB record for the document, but no rating yet for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          userRatings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              rating: 5,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          userRatingsCount: 1,
          averageRating: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should add the new rating for the user and update the average rating to the correct value', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          userRatings: [...dbRecordBeforeUpdate.userRatings, { userId, rating, timestamp }],
          userRatingsCount: 2,
          averageRating: 4
        });
      });
    });

    describe('when there is a DB record for the document and an existing rating for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          userRatings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              rating: 5,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            }, {
              userId,
              rating: 5,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          userRatingsCount: 2,
          averageRating: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should replace the old rating for the user with the new one and update the average rating to the correct value', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          userRatings: [...dbRecordBeforeUpdate.userRatings.filter(r => r.userId !== userId), { userId, rating, timestamp }],
          averageRating: 4
        });
      });
    });
  });

  describe('deleteUserDocumentRating', () => {
    let dbRecordBeforeUpdate;
    let dbRecordAfterUpdate;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';

    describe('when there is no DB record for the specified document', () => {
      beforeEach(async () => {
        await sut.deleteUserDocumentRating({ documentId, userId });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should not create one', () => {
        expect(dbRecordAfterUpdate).toBeNull();
      });
    });

    describe('when there is a DB record for the document, but no rating yet for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          userRatings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              rating: 5,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          userRatingsCount: 1,
          averageRating: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.deleteUserDocumentRating({ documentId, userId });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should not change the existing record', () => {
        expect(dbRecordAfterUpdate).toStrictEqual(dbRecordBeforeUpdate);
      });
    });

    describe('when there is a DB record for the document and an existing rating for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          userRatings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              rating: 5,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            },
            {
              userId,
              rating: 3,
              timestamp: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          userRatingsCount: 2,
          averageRating: 4
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.deleteUserDocumentRating({ documentId, userId });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should remove the old rating for the user and update the average rating to the correct value', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          userRatings: dbRecordBeforeUpdate.userRatings.filter(r => r.userId !== userId),
          userRatingsCount: 1,
          averageRating: 5
        });
      });
    });

  });
});
