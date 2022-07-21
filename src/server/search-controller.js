import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import { ensureIsUnique } from '../utils/array-utils.js';
import DocumentService from '../services/document-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import { getSearchQuerySchema } from '../domain/schemas/search-schemas.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

export default class SearchController {
  static get inject() { return [DocumentService, RoomService, ClientDataMappingService, PageRenderer]; }

  constructor(documentService, roomService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  handleGetSearchPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.search, {});
  }

  async handleGetSearchResult(req, res) {
    const { query } = req.query;
    const docs = await this.documentService.getSearchableDocumentsMetadataByTags(query);
    const roomIds = ensureIsUnique(docs.map(doc => doc.roomId).filter(roomId => roomId));
    const rooms = await this.roomService.getRoomsMinimalMetadataByIds(roomIds);

    const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(docs, req.user);

    return res.send({ documents: mappedDocuments, rooms });
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
