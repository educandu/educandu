import sinon from 'sinon';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import DocumentController from './document-controller.js';

describe('document-controller', () => {
  const sandbox = sinon.createSandbox();

  let documentService;
  let clientDataMapper;
  let pageRenderer;

  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      createDocumentRegenerationBatch: sandbox.stub()
    };

    user = { _id: 'my user' };

    sut = new DocumentController(documentService, clientDataMapper, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostDocumentRegenerationBatch', () => {
    const batch = { _id: uniqueId.create() };
    beforeEach(done => {
      documentService.createDocumentRegenerationBatch.resolves(batch);

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      sut.handlePostDocumentRegenerationBatch(req, res);
    });

    it('should call createDocumentRegenerationBatch with the user', () => {
      sinon.assert.calledWith(documentService.createDocumentRegenerationBatch, user);
    });

    it('should return the batch', () => {
      expect(res._getData()).toEqual(batch);
    });
  });

});
