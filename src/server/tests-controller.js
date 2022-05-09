import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class TestsController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetTestsPage(req, res) {
    const initialState = {};

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  registerPages(router) {
    router.get(
      '/tests',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }
}

export default TestsController;
