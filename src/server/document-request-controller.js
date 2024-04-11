import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import DocumentService from '../services/document-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { parseNumberArrayFromCsv, parseDate } from '../utils/query-utils.js';
import DocumentRequestService from '../services/document-request-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { getDocumentRequestsForMaintenanceQuerySchema } from '../domain/schemas/document-request-schemas.js';

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
    const { registeredFrom, registeredUntil, daysOfWeek } = req.query;

    const parsedRegisteredFrom = parseDate(registeredFrom);
    const parsedRegisteredUntil = parseDate(registeredUntil);
    const parsedDaysOfWeek = parseNumberArrayFromCsv(daysOfWeek);

    const documentRequestCounters = await this.documentRequestService.getAllDocumentRequestCounters({
      registeredFrom: parsedRegisteredFrom,
      registeredUntil: parsedRegisteredUntil,
      daysOfWeek: parsedDaysOfWeek
    });

    const mappedDocumentRequestCounters = await this.clientDataMappingService.mapDocumentRequestCounters({ documentRequestCounters });

    return res.send({ documentRequestCounters: mappedDocumentRequestCounters });
  }

  registerApi(router) {
    router.get(
      '/api/v1/document-requests/maintenance',
      validateQuery(getDocumentRequestsForMaintenanceQuerySchema),
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetDocumentRequestsForMaintenance(req, res)
    );
  }
}

export default DocumentController;
