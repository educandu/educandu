import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ClientDataMapper from './client-data-mapper.js';
import DocumentService from '../services/document-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import { getSearchQuerySchema } from '../domain/schemas/search-schemas.js';

export default class SearchController {
  static get inject() { return [DocumentService, ClientDataMapper, PageRenderer]; }

  constructor(documentService, clientDataMapper, pageRenderer) {
    this.documentService = documentService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  handleGetSearchPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.search, {});
  }

  async handleGetSearchResult(req, res) {
    const { query } = req.query;
    const docs = await this.documentService.getDocumentsMetadataByTags(query);
    const result = await this.clientDataMapper.mapDocsOrRevisions(docs, req.user);
    return res.send({ result });
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
