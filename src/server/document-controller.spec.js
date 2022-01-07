import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import DocumentController from './document-controller.js';
import { setupTestUser, setupTestEnvironment, destroyTestEnvironment, pruneTestEnvironment } from '../test-helper.js';

const { BadRequest } = httpErrors;

describe('document-controller', () => {
  const sandbox = sinon.createSandbox();
  let container;

  let documentService;
  let clientDataMapper;
  let pageRenderer;

  let user;
  let req;
  let res;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    documentService = {
      createRegenerateDocumentsBatch: sandbox.stub()
    };

    sut = new DocumentController(documentService, clientDataMapper, pageRenderer);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('handlePostRegenerateDocumentsBatch', () => {

    describe('when all goes well', () => {
      const batch = { _id: uniqueId.create() };
      beforeEach(done => {
        documentService.createRegenerateDocumentsBatch.resolves(batch);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePostRegenerateDocumentsBatch(req, res);
      });

      it('should call createDocumentsBatch with the user', () => {
        sinon.assert.calledWith(documentService.createRegenerateDocumentsBatch, user);
      });

      it('should return the batch', () => {
        expect(res._getData()).toEqual(batch);
      });
    });

    describe('when we cannot schedule a new batch', () => {
      beforeEach(() => {
        documentService.createRegenerateDocumentsBatch.resolves(null);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should throw a bad request', () => {
        expect(() => sut.handlePostRegenerateDocumentsBatch(req, res)).rejects.toThrow(BadRequest);
      });
    });
  });
});
