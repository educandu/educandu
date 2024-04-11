import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentRequestService from '../services/document-request-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class DocumentController {
  static dependencies = [
    DocumentService,
    DocumentRequestService,
    ClientDataMappingService,
    PageRenderer
  ];

  constructor(
    documentService,
    documentRequestService,
    clientDataMappingService,
    pageRenderer
  ) {
    this.documentService = documentService;
    this.documentRequestService = documentRequestService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetDocumentRequestsForMaintenance(req, res) {
    const documentRequestCounters = await this.documentRequestService.getAllDocumentRequestCounters();
    const mappedDocumentRequestCounters = await this.clientDataMappingService.mapDocumentRequestCounters({ documentRequestCounters });

    return res.send({ documentRequestCounters: mappedDocumentRequestCounters });
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-requests/maintenance',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetDocumentRequestsForMaintenance(req, res)
    );
  }
}

export default DocumentController;
