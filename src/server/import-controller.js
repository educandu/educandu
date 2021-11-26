import express from 'express';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import ExportApiClient from '../services/export-api-client.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery } from '../domain/validation-middleware.js';
import { getImportsQuerySchema, postImportBatchBodySchema } from '../domain/schemas/import-schemas.js';

const { NotFound } = httpErrors;

const jsonParser = express.json();

class ImportController {
  static get inject() { return [ImportService, ExportApiClient, ServerConfig, PageRenderer]; }

  constructor(importService, exportApiClient, serverConfig, pageRenderer) {
    this.exportApiClient = exportApiClient;
    this.importService = importService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/imports', needsPermission(permissions.MANAGE_IMPORT), (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'imports');
    });
    app.get('/imports/create', needsPermission(permissions.MANAGE_IMPORT), (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'create-import');
    });
  }

  registerApi(router) {
    router.get('/api/v1/imports', [needsPermission(permissions.MANAGE_IMPORT), validateQuery(getImportsQuerySchema)], async (req, res) => {
      const { importSourceName } = req.query;

      const importSource = this.serverConfig.importSources.find(source => source.name === importSourceName);
      if (!importSource) {
        throw new NotFound(`${importSourceName} is not a known import source`);
      }

      const documents = await this.importService.getAllImportableDocumentsMetadata(importSource);
      res.send({ documents });
    });

    router.post('/api/v1/imports/batch', [jsonParser, needsPermission(permissions.MANAGE_IMPORT), validateBody(postImportBatchBodySchema)], async (req, res) => {
      const { importSourceName, documentsToImport } = req.body;
      const user = req.user;

      const importSource = this.serverConfig.importSources.find(source => source.name === importSourceName);
      if (!importSource) {
        throw new NotFound(`${importSourceName} is not a known import source`);
      }

      const batch = await this.importService.createImportBatch({ importSource, documentsToImport, user });
      res.send({ batch });
    });
  }
}

export default ImportController;
