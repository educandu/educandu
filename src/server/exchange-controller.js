import permissions from '../domain/permissions.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ExchangeController {
  static get inject() { return [DocumentService]; }

  constructor(documentService) {
    this.documentService = documentService;
  }

  registerApi(router) {
    router.get('/api/v1/exchange/exports', [needsPermission(permissions.LIST_EXPORTABLE_CONTENT)], async (req, res) => {
      const docs = await this.documentService.getAllExportableDocumentsMetadata();
      return res.send({ docs });
    });
  }
}

export default ExchangeController;
