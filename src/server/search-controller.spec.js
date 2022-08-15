/* eslint-disable max-lines */
import sinon from 'sinon';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import SearchController from './search-controller.js';

describe('search-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let documentService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getSearchableDocumentsMetadataByTags: sandbox.stub()
    };
    clientDataMappingService = {
      mapDocsOrRevisions: sandbox.stub()
    };
    user = { _id: uniqueId.create() };

    sut = new SearchController(documentService, clientDataMappingService, {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetSearchResult', () => {
    let documents;
    let mappedDocuments;

    beforeEach(() => new Promise((resolve, reject) => {
      req = { user, query: { query: 'Musik' } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      documents = [
        { _id: 'D1' },
        { _id: 'D2' },
        { _id: 'D3' }
      ];
      mappedDocuments = cloneDeep(documents);

      clientDataMappingService.mapDocsOrRevisions.resolves(mappedDocuments);
      documentService.getSearchableDocumentsMetadataByTags.resolves(documents);

      sut.handleGetSearchResult(req, res).catch(reject);
    }));

    it('should call documentService.getSearchableDocumentsMetadataByTags', () => {
      sinon.assert.calledWith(documentService.getSearchableDocumentsMetadataByTags, 'Musik');
    });

    it('should call clientDataMappingService.mapDocsOrRevisions', () => {
      sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents, user);
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });
});
