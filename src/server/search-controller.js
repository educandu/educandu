import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import DocumentService from '../services/document-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import MediaLibraryService from '../services/media-library-service.js';
import { getSearchQuerySchema } from '../domain/schemas/search-schemas.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

export default class SearchController {
  static dependencies = [DocumentService, MediaLibraryService, ClientDataMappingService, PageRenderer];

  constructor(documentService, mediaLibraryService, clientDataMappingService, pageRenderer) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.mediaLibraryService = mediaLibraryService;
    this.clientDataMappingService = clientDataMappingService;
  }

  handleGetSearchPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.search, {});
  }

  async handleGetSearchResult(req, res) {
    const { query } = req.query;

    const documents = await this.documentService.getSearchableDocumentsMetadataByTags(query);
    const mediaLibraryItems = await this.mediaLibraryService.getSearchableMediaLibraryItemsByTags(query);

    const searchableResults = await this.clientDataMappingService.mapSearchableResults({ documents, mediaLibraryItems });

    return res.send(searchableResults);
  }

  registerPages(router) {
    router.get(
      '/search',
      validateQuery(getSearchQuerySchema),
      (req, res) => this.handleGetSearchPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/search',
      validateQuery(getSearchQuerySchema),
      (req, res) => this.handleGetSearchResult(req, res)
    );
  }
}
