import Database from '../stores/database.js';
import permissions from '../domain/permissions.js';
import ExportService from '../services/export-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ExportController {
  static get inject() { return [ExportService, Database]; }

  constructor(exportService, database) {
    this.exportService = exportService;
    this.database = database;
  }

  registerApi(router) {
    router.get('/api/v1/exports', [needsPermission(permissions.MANAGE_EXPORT)], async (req, res) => {
      const importingSystemSchemaHash = req.query.databaseSchemaHash;

      if (!importingSystemSchemaHash) {
        res.status(400).send('databaseSchemaHash query param is required');
        return;
      }

      let docs = [];
      const schemaHash = this.database.schemaHash;

      if (schemaHash === importingSystemSchemaHash) {
        docs = await this.documentService.getAllExportableDocumentsMetadata();
      }

      res.send({ schemaHash, docs });
    });
  }
}

export default ExportController;
