import sinon from 'sinon';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import AdminController from './admin-controller.js';

describe('admin-controller', () => {
  const sandbox = sinon.createSandbox();

  let settingService;
  let documentService;
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
    documentService = {};
    clientDataMappingService = {};

    batchService = {
      createDocumentRegenerationBatch: sandbox.stub()
    };

    user = { _id: uniqueId.create() };

    sut = new AdminController(settingService, documentService, storageService, batchService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostDocumentRegenerationRequest', () => {
    const batch = { _id: uniqueId.create() };
    beforeEach(done => {
      batchService.createDocumentRegenerationBatch.resolves(batch);

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      sut.handlePostDocumentRegenerationRequest(req, res);
    });

    it('should call createDocumentRegenerationBatch with the user', () => {
      sinon.assert.calledWith(batchService.createDocumentRegenerationBatch, user);
    });

    it('should return the batch', () => {
      expect(res._getData()).toEqual(batch);
    });
  });

});
