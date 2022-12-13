import sinon from 'sinon';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import AdminController from './admin-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('admin-controller', () => {
  const sandbox = sinon.createSandbox();

  let settingService;
  let storageService;
  let batchService;
  let clientDataMappingService;
  let pageRenderer;

  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    pageRenderer = {};
    settingService = {};
    storageService = {};
    clientDataMappingService = {};

    batchService = {
      createDocumentRegenerationBatch: sandbox.stub()
    };

    user = { _id: uniqueId.create() };

    sut = new AdminController(settingService, storageService, batchService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostDocumentRegenerationRequest', () => {
    const batch = { _id: uniqueId.create() };
    beforeEach(() => new Promise((resolve, reject) => {
      batchService.createDocumentRegenerationBatch.resolves(batch);

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handlePostDocumentRegenerationRequest(req, res).catch(reject);
    }));

    it('should call createDocumentRegenerationBatch with the user', () => {
      sinon.assert.calledWith(batchService.createDocumentRegenerationBatch, user);
    });

    it('should return the batch', () => {
      expect(res._getData()).toEqual(batch);
    });
  });

});
