import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import ServerConfig from '../bootstrap/server-config.js';
import ImportService from '../services/import-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ExportApiClient from '../services/export-api-client.js';

class ImportController {
  static get inject() { return [ImportService, ExportApiClient, ServerConfig, PageRenderer]; }

  constructor(importService, exportApiClient, serverConfig, pageRenderer) {
    this.exportApiClient = exportApiClient;
    this.importService = importService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    // Return page with dropdown only! update JIRA ticket
    app.get('/import', needsPermission(permissions.MANAGE_IMPORT), async (req, res) => {
      const exportableDocuments = await this.exportApiClient.getExportableDocumentsMetadata();
      const importableDocuments = await this.importService.getAllImportableDocumentsMetadata(exportableDocuments);
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'import', { documents: importableDocuments });
    });
  }
}

export default ImportController;
