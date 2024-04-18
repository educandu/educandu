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

  describe('saveRating', () => {
    let dbRecordBeforeUpdate;
    let dbRecordAfterUpdate;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';
    const value = 3;
    const ratedOn = new Date();

    describe('when there is no DB record for the specified document', () => {
      beforeEach(async () => {
        await sut.saveRating({ documentId, userId, value, ratedOn });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should create a new record with the correct values', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          _id: expect.any(String),
          documentId,
          ratings: [{ userId, value, ratedOn }],
          ratingsCount: 1,
          ratingsCountPerValue: [0, 0, 1, 0, 0],
          averageRatingValue: value
        });
      });
    });

    describe('when there is a DB record for the document, but no rating yet for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          ratings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              value: 5,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          ratingsCount: 1,
          ratingsCountPerValue: [0, 0, 0, 0, 1],
          averageRatingValue: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.saveRating({ documentId, userId, value, ratedOn });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should add the new rating for the user and update all calculated fields', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          ratings: [...dbRecordBeforeUpdate.ratings, { userId, value, ratedOn }],
          ratingsCount: 2,
          ratingsCountPerValue: [0, 0, 1, 0, 1],
          averageRatingValue: 4
        });
      });
    });

    describe('when there is a DB record for the document and an existing rating for the specified user', () => {
      beforeEach(async () => {
        dbRecordBeforeUpdate = {
          _id: '6n8iHqpjvU4A6bcHjHCcE9',
          documentId,
          ratings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              value: 5,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            }, {
              userId,
              value: 5,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          ratingsCount: 2,
          ratingsCountPerValue: [0, 0, 0, 0, 2],
          averageRatingValue: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.saveRating({ documentId, userId, value, ratedOn });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should replace the old rating for the user with the new one and update all calculated fields', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          ratings: [...dbRecordBeforeUpdate.ratings.filter(r => r.userId !== userId), { userId, value, ratedOn }],
          ratingsCountPerValue: [0, 0, 1, 0, 1],
          averageRatingValue: 4
        });
      });
    });
  });

  describe('deleteRating', () => {
    let dbRecordBeforeUpdate;
    let dbRecordAfterUpdate;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';

    describe('when there is no DB record for the specified document', () => {
      beforeEach(async () => {
        await sut.deleteRating({ documentId, userId });
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
          ratings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              value: 5,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          ratingsCount: 1,
          ratingsCountPerValue: [0, 0, 0, 0, 1],
          averageRatingValue: 5
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.deleteRating({ documentId, userId });
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
          ratings: [
            {
              userId: 'RZXM5QxCyYPWzFT2HpzLqz',
              value: 5,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            },
            {
              userId,
              value: 3,
              ratedOn: new Date('2024-04-01T00:00:00.000Z')
            }
          ],
          ratingsCount: 2,
          ratingsCountPerValue: [0, 0, 1, 0, 1],
          averageRatingValue: 4
        };
        await db.documentRatings.insertOne(dbRecordBeforeUpdate);
        await sut.deleteRating({ documentId, userId });
        dbRecordAfterUpdate = await db.documentRatings.findOne({ documentId });
      });

      it('should remove the old rating for the user and update all calculated fields', () => {
        expect(dbRecordAfterUpdate).toStrictEqual({
          ...dbRecordBeforeUpdate,
          ratings: dbRecordBeforeUpdate.ratings.filter(r => r.userId !== userId),
          ratingsCount: 1,
          ratingsCountPerValue: [0, 0, 0, 0, 1],
          averageRatingValue: 5
        });
      });
    });

  });
});
