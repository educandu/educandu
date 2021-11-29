import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import permissions from '../domain/permissions.js';
import ExportService from '../services/export-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { getExportsQuerySchema, getExportsDocumentQuerySchema } from '../domain/schemas/export-schemas.js';

const { BadRequest } = httpErrors;

class ExportController {
  static get inject() { return [ExportService, Database]; }

  constructor(exportService, database) {
    this.exportService = exportService;
    this.database = database;
  }

  registerApi(router) {
    router.get('/api/v1/exports', [needsPermission(permissions.MANAGE_EXPORT), validateQuery(getExportsQuerySchema)], async (req, res) => {
      const importingSystemSchemaHash = req.query.databaseSchemaHash;

      let docs = [];
      const schemaHash = await this.database.getSchemaHash();

      if (schemaHash !== importingSystemSchemaHash) {
        throw new BadRequest(`Database schema mismatch between request (${schemaHash}) and host (${importingSystemSchemaHash})`);
      }

      docs = await this.exportService.getAllExportableDocumentsMetadata();
      res.send({ schemaHash, docs });
    });

    router.get('/api/v1/exports/:key', validateQuery(getExportsDocumentQuerySchema), async (req, res) => {
      const key = req.params.key;
      const fromRevision = req.query.fromRevision || null;
      const toRevision = req.query.toRevision;
      const importingSystemSchemaHash = req.query.databaseSchemaHash;

      const schemaHash = await this.database.getSchemaHash();
      if (schemaHash !== importingSystemSchemaHash) {
        throw new BadRequest(`Database schema mismatch between request (${schemaHash}) and host (${importingSystemSchemaHash})`);
      }

      const { doc, users } = await this.exportService.getDocumentExport({ key, fromRevision, toRevision });

      res.send({ doc, users });
    });
  }
}

export default ExportController;
