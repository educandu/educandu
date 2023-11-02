import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import SearchController from './search-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('search-controller', () => {
  const sandbox = createSandbox();

  let clientDataMappingService;
  let mediaLibraryService;
  let documentService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getSearchableDocumentsMetadataByTags: sandbox.stub()
    };
    mediaLibraryService = {
      getSearchableMediaLibraryItemsByTags: sandbox.stub()
    };
    clientDataMappingService = {
      mapSearchableResults: sandbox.stub()
    };
    user = { _id: uniqueId.create() };

    sut = new SearchController(documentService, mediaLibraryService, clientDataMappingService, {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetSearchResult', () => {
    let documents;
    let mappedResults;
    let mediaLibraryItems;

    beforeEach(() => new Promise((resolve, reject) => {
      req = { user, query: { query: 'Musik' } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      documents = [
        { _id: 'D1' },
        { _id: 'D2' },
        { _id: 'D3' }
      ];
      mediaLibraryItems = [
        { _id: 'I1' },
        { _id: 'I2' },
        { _id: 'I3' }
      ];
      mappedResults = [...documents, ...mediaLibraryItems];

      documentService.getSearchableDocumentsMetadataByTags.resolves(documents);
      mediaLibraryService.getSearchableMediaLibraryItemsByTags.resolves(mediaLibraryItems);
      clientDataMappingService.mapSearchableResults.resolves(mappedResults);

      sut.handleGetSearchResult(req, res).catch(reject);
    }));

    it('should call documentService.getSearchableDocumentsMetadataByTags', () => {
      assert.calledWith(documentService.getSearchableDocumentsMetadataByTags, 'Musik');
    });

    it('should call mediaLibraryService.getSearchableMediaLibraryItemsByTags', () => {
      assert.calledWith(mediaLibraryService.getSearchableMediaLibraryItemsByTags, 'Musik');
    });

    it('should call clientDataMappingService.mapSearchableResults', () => {
      assert.calledWith(clientDataMappingService.mapSearchableResults, { documents, mediaLibraryItems });
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });
});
