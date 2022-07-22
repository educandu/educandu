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
  let roomService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    roomService = {
      getRoomsMinimalMetadataByIds: sandbox.stub()
    };
    documentService = {
      getSearchableDocumentsMetadataByTags: sandbox.stub()
    };
    clientDataMappingService = {
      mapDocsOrRevisions: sandbox.stub()
    };
    user = { _id: uniqueId.create() };

    sut = new SearchController(documentService, roomService, clientDataMappingService, {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetSearchResult', () => {
    let rooms;
    let documents;
    let mappedDocuments;

    beforeEach(() => new Promise((resolve, reject) => {
      req = { user, query: { query: 'Musik' } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      rooms = [{ _id: 'R1' }];
      documents = [
        { _id: 'D1', roomId: null },
        { _id: 'D2', roomId: 'R1' },
        { _id: 'D3', roomId: 'R1' }
      ];
      mappedDocuments = cloneDeep(documents);

      roomService.getRoomsMinimalMetadataByIds.resolves(rooms);
      clientDataMappingService.mapDocsOrRevisions.resolves(mappedDocuments);
      documentService.getSearchableDocumentsMetadataByTags.resolves(documents);

      sut.handleGetSearchResult(req, res).catch(reject);
    }));

    it('should call documentService.getSearchableDocumentsMetadataByTags', () => {
      sinon.assert.calledWith(documentService.getSearchableDocumentsMetadataByTags, 'Musik');
    });

    it('should call roomService.getRoomsMinimalMetadataByIds', () => {
      sinon.assert.calledWith(roomService.getRoomsMinimalMetadataByIds, ['R1']);
    });

    it('should call clientDataMappingService.mapDocsOrRevisions', () => {
      sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents, user);
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the documents and rooms', () => {
      expect(res._getData()).toEqual({ documents: mappedDocuments, rooms });
    });
  });
});
