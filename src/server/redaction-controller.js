import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class DashboardController {
  static get inject() { return [DocumentService, ClientDataMappingService, PageRenderer]; }

  constructor(documentService, clientDataMappingService, pageRenderer) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRedactionPage(req, res) {
    const includeArchived = hasUserPermission(req.user, permissions.MANAGE_ARCHIVED_DOCS);
    const documents = await this.documentService.getAllPublicDocumentsMetadata({ includeArchived });

    const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.redaction, { documents: mappedDocuments });
  }

  registerPages(router) {
    router.get(
      '/redaction',
      needsPermission(permissions.MANAGE_CONTENT),
      (req, res) => this.handleGetRedactionPage(req, res)
    );
  }
}

export default DashboardController;
