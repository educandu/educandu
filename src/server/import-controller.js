import express from 'express';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import ExportApiClient from '../services/export-api-client.js';
import needsPermission from '../domain/needs-permission-middleware.js';

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
    app.get('/import', needsPermission(permissions.MANAGE_IMPORT), (req, res) => {
      const initialState = { importSources: this.serverConfig.importSources };
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'import', initialState);
    });
  }

  registerApi(router) {
    router.get('/api/v1/imports', [needsPermission(permissions.MANAGE_IMPORT), jsonParser], async (req, res) => {
      // ToDo: Validate query params are all provided
      const importSource = {
        name: req.query.name,
        baseUrl: req.query.baseUrl,
        apiKey: req.query.apiKey
      };

      const documents = await this.importService.getAllImportableDocumentsMetadata(importSource);
      return res.send({ documents });
    });
  }
}

export default ImportController;
