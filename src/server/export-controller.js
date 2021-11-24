import permissions from '../domain/permissions.js';
import ExportService from '../services/export-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ExportController {
  static get inject() { return [ExportService]; }

  constructor(exportService) {
    this.exportService = exportService;
  }

  registerApi(router) {
    router.get('/api/v1/exports', [needsPermission(permissions.MANAGE_EXPORT)], async (req, res) => {
      const docs = await this.documentService.getAllExportableDocumentsMetadata();
      return res.send({ docs });
    });
  }
}

export default ExportController;
