import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import ExportApiClient from '../services/export-api-client.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { getImportsQuerySchema } from '../domain/schemas/import-schemas.js';

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
    router.get('/api/v1/imports', [needsPermission(permissions.MANAGE_IMPORT), validateQuery(getImportsQuerySchema)], async (req, res) => {
      const importSource = {
        name: req.query.importSourceName,
        baseUrl: req.query.importSourceBaseUrl,
        apiKey: req.query.importSourceApiKey
      };

      const documents = await this.importService.getAllImportableDocumentsMetadata(importSource, true);
      return res.send({ documents });
    });
  }
}

export default ImportController;
