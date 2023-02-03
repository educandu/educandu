import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import BatchController from './batch-controller.js';
import { BATCH_TYPE } from '../domain/constants.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('admin-controller', () => {
  const sandbox = createSandbox();

  let pageRenderer;
  let batchService;
  let clientDataMappingService;

  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    pageRenderer = {};

    batchService = {
      createBatch: sandbox.stub()
    };

    clientDataMappingService = {};

    user = { _id: uniqueId.create() };

    sut = new BatchController(pageRenderer, batchService, clientDataMappingService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostBatchRequest', () => {
    const batchType = BATCH_TYPE.documentRegeneration;
    const batch = { _id: uniqueId.create(), batchType };
    beforeEach(() => new Promise((resolve, reject) => {
      batchService.createBatch.withArgs({ batchType, user }).resolves(batch);

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' },
        params: { batchType }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handlePostBatchRequest(req, res).catch(reject);
    }));

    it('should call batchService.createBatch with the batch type and user', () => {
      assert.calledWith(batchService.createBatch, { batchType, user });
    });

    it('should return the batch', () => {
      expect(res._getData()).toEqual(batch);
    });
  });

});
