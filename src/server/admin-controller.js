import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import requestUtils from '../utils/request-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class AdminController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetAdminPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.admin, {});
  }

  handleGetRequestInfoRequest(req, res) {
    return res.send(requestUtils.requestToPlainObject(req));
  }

  registerPages(router) {
    router.get(
      '/admin',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetAdminPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/admin/request-info',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetRequestInfoRequest(req, res)
    );
  }
}

export default AdminController;
