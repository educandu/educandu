import { createSandbox } from 'sinon';
import DocumentRatingStore from './document-rating-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

describe('document-rating-store', () => {
  let sut;
  let container;
  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
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
    let result;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';
    const rating = 3;
    const timestamp = new Date();

    describe('when called for the first time, it should do nothing', () => {
      beforeEach(async () => {
        result = await sut.createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp });
      });

      it('should return null', () => {
        // eslint-disable-next-line no-undefined
        expect(result).toBe(null);
      });
    });
  });

  describe('deleteUserDocumentRating', () => {
    let result;
    const documentId = '7qo6DoqGbbkGL45ckgyeWH';
    const userId = 'gEQXRGqNYBtEpo2c8uKcQp';

    describe('when called for the first time, it should do nothing', () => {
      beforeEach(async () => {
        result = await sut.deleteUserDocumentRating({ documentId, userId });
      });

      it('should return null', () => {
        // eslint-disable-next-line no-undefined
        expect(result).toBe(null);
      });
    });
  });
});
