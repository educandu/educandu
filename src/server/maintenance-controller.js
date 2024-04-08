import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class MaintenanceController {
  static dependencies = [PageRenderer];

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetMaintenancePage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.maintenance);
  }

  registerPages(router) {
    router.get(
      '/maintenance',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetMaintenancePage(req, res)
    );
  }
}

export default MaintenanceController;
