import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ExchangeController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  registerPages(app) {
    app.get('/exchange/import', needsPermission(permissions.MANAGE_IMPORT), (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'import', {});
    });
  }

  registerApi(router) {
    router.get('/api/v1/exchange/exports', [needsPermission(permissions.MANAGE_EXPORT)], async (req, res) => {
      const docs = await this.documentService.getAllExportableDocumentsMetadata();
      return res.send({ docs });
    });
  }
}

export default ExchangeController;
