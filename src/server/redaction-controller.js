import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import MediaLibraryService from '../services/media-library-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class RedactionController {
  static dependencies = [DocumentService, MediaLibraryService, ClientDataMappingService, PageRenderer];

  constructor(documentService, mediaLibraryService, clientDataMappingService, pageRenderer) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.mediaLibraryService = mediaLibraryService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRedactionPage(req, res) {
    const { user } = req;

    const [documents, mediaLibraryItems] = await Promise.all([
      this.documentService.getAllPublicDocumentsMetadata({ includeArchived: true }),
      this.mediaLibraryService.getAllMediaLibraryItems()
    ]);

    const [mappedDocuments, mappedMediaLibraryItems] = await Promise.all([
      this.clientDataMappingService.mapDocsOrRevisions(documents, user),
      this.clientDataMappingService.mapMediaLibraryItems(mediaLibraryItems, user)
    ]);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.redaction, {
      documents: mappedDocuments,
      mediaLibraryItems: mappedMediaLibraryItems
    });
  }

  registerPages(router) {
    router.get(
      '/redaction',
      needsPermission(permissions.MANAGE_CONTENT),
      (req, res) => this.handleGetRedactionPage(req, res)
    );
  }
}

export default RedactionController;
