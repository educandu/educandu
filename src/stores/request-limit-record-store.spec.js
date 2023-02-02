import RequestLimitRecordStore from './request-limit-record-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

describe('request-limit-record-store', () => {
  let sut;
  let container;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RequestLimitRecordStore);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('createOrUpdateRequestLimitRecord', () => {
    let result;
    const ipAddress = '192.168.0.1';
    const requestKey = '/api/v1/users/login';
    const setExpiresOnOnInsert = new Date();
    const maxRequests = 3;

    describe('when called for the first time, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
      });

      it('should return 1', () => {
        expect(result).toBe(1);
      });
    });

    describe('when called 2 times, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
      });

      it('should return 2', () => {
        expect(result).toBe(2);
      });
    });

    describe('when called 3 times, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
      });

      it('should return 3', () => {
        expect(result).toBe(3);
      });
    });

    describe('when called 4 times, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert, maxRequests });
      });

      it('should return 3', () => {
        expect(result).toBe(3);
      });
    });
  });
});
