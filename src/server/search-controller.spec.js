import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import SearchController from './search-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('search-controller', () => {
  const sandbox = createSandbox();

  let clientDataMappingService;
  let documentRatingService;
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
      getSearchableMediaLibraryItems: sandbox.stub()
    };
    documentRatingService = {
      getDocumentRatingsByDocumentIds: sandbox.stub()
    };
    clientDataMappingService = {
      mapSearchableResults: sandbox.stub()
    };
    user = { _id: uniqueId.create() };

    sut = new SearchController(documentService, mediaLibraryService, documentRatingService, clientDataMappingService, {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetSearchResult', () => {
    let documents;
    let mappedResults;
    let documentRatings;
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
      documentRatings = [
        { _id: 'DR2', documentId: 'D1' },
        { _id: 'DR1', documentId: 'D2' },
        { _id: 'DR3', documentId: 'D3' }
      ];
      mediaLibraryItems = [
        { _id: 'I1' },
        { _id: 'I2' },
        { _id: 'I3' }
      ];
      mappedResults = [...documents, ...mediaLibraryItems];

      documentService.getSearchableDocumentsMetadataByTags.resolves(documents);
      documentRatingService.getDocumentRatingsByDocumentIds.resolves(documentRatings);
      mediaLibraryService.getSearchableMediaLibraryItems.resolves(mediaLibraryItems);
      clientDataMappingService.mapSearchableResults.resolves(mappedResults);

      sut.handleGetSearchResult(req, res).catch(reject);
    }));

    it('should call documentService.getSearchableDocumentsMetadataByTags', () => {
      assert.calledWith(documentService.getSearchableDocumentsMetadataByTags, 'Musik');
    });

    it('should call documentRatingService.getDocumentRatingsByDocumentIds', () => {
      assert.calledWith(documentRatingService.getDocumentRatingsByDocumentIds, ['D1', 'D2', 'D3']);
    });

    it('should call mediaLibraryService.getSearchableMediaLibraryItems', () => {
      assert.calledWith(mediaLibraryService.getSearchableMediaLibraryItems, { query: 'Musik' });
    });

    it('should call clientDataMappingService.mapSearchableResults', () => {
      assert.calledWith(clientDataMappingService.mapSearchableResults, { documents, documentRatings, mediaLibraryItems });
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });
});
