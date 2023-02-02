import { createSandbox } from 'sinon';
import RequestLimitRecordStore from './request-limit-record-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

describe('request-limit-record-store', () => {
  let sut;
  let container;
  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RequestLimitRecordStore);
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

  describe('createOrUpdateRequestLimitRecord', () => {
    let result;
    const ipAddress = '192.168.0.1';
    const requestKey = '/api/v1/users/login';
    const maxRequests = 3;

    describe('when called for the first time, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
      });

      it('should return 1', () => {
        expect(result.count).toBe(1);
      });
    });

    describe('when called 2 times, while having maxRequests set to 3', () => {
      let initialExpiry;
      let secondExpiry;

      beforeEach(async () => {
        initialExpiry = new Date();
        secondExpiry = new Date(sandbox.clock.tick(1000));
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: initialExpiry, maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: secondExpiry, maxRequests });
      });

      it('should return 2', () => {
        expect(result.count).toBe(2);
      });

      it('should keep the initial expiry date', () => {
        expect(result.expiresOn).toEqual(initialExpiry);
      });
    });

    describe('when called 3 times, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
      });

      it('should return 3', () => {
        expect(result.count).toBe(3);
      });
    });

    describe('when called 4 times, while having maxRequests set to 3', () => {
      beforeEach(async () => {
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
        await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
        result = await sut.createOrUpdateRequestLimitRecord({ ipAddress, requestKey, setExpiresOnOnInsert: new Date(), maxRequests });
      });

      it('should return 3', () => {
        expect(result.count).toBe(3);
      });
    });
  });
});
