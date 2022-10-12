import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import permissions from '../domain/permissions.js';
import ExportService from '../services/export-service.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { getExportsQuerySchema, getExportsDocumentQuerySchema } from '../domain/schemas/export-schemas.js';

const { BadRequest, Forbidden } = httpErrors;

class ExportController {
  static get inject() { return [ExportService, Database]; }

  constructor(exportService, database) {
    this.exportService = exportService;
    this.database = database;
  }

  async handleGetExports(req, res) {
    const importingSystemSchemaHash = req.query.databaseSchemaHash;

    let docs = [];
    const schemaHash = await this.database.getSchemaHash();

    if (schemaHash !== importingSystemSchemaHash) {
      throw new BadRequest(`Database schema mismatch between importing system (${importingSystemSchemaHash}) and exporting system (${schemaHash})`);
    }

    docs = await this.exportService.getAllExportableDocumentsMetadata();
    return res.send({ schemaHash, docs });
  }

  async handleGetExport(req, res) {
    const documentId = req.params.documentId;
    const includeEmails = req.query.includeEmails === true.toString();

    const importingSystemSchemaHash = req.query.databaseSchemaHash;

    const schemaHash = await this.database.getSchemaHash();
    if (schemaHash !== importingSystemSchemaHash) {
      throw new BadRequest(`Database schema mismatch between importing system (${importingSystemSchemaHash}) and exporting system (${schemaHash})`);
    }

    const { revisions, users, cdnRootUrl } = await this.exportService.getDocumentExport({ documentId, includeEmails });
    if (revisions.some(revision => revision.roomId)) {
      throw new Forbidden('Private documents cannot be exported');
    }

    return res.send({ revisions, users, cdnRootUrl });
  }

  registerApi(router) {
    router.get(
      '/api/v1/exports',
      [needsPermission(permissions.MANAGE_EXPORT_WITH_BUILT_IN_USER), validateQuery(getExportsQuerySchema)],
      (req, res) => this.handleGetExports(req, res)
    );

    router.get(
      '/api/v1/exports/:documentId',
      [needsPermission(permissions.MANAGE_EXPORT_WITH_BUILT_IN_USER), validateQuery(getExportsDocumentQuerySchema)],
      (req, res) => this.handleGetExport(req, res)
    );
  }
}

export default ExportController;
