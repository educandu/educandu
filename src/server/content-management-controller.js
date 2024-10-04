import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class ContentManagementController {
  static dependencies = [PageRenderer];

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetContentManagementPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.contentManagement);
  }

  registerPages(router) {
    router.get(
      '/content-management',
      needsPermission(permissions.MANAGE_PUBLIC_CONTENT),
      (req, res) => this.handleGetContentManagementPage(req, res)
    );
  }
}

export default ContentManagementController;
