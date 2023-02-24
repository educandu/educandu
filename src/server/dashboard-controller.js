import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';

class DashboardController {
  static dependencies = [PageRenderer];

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetDashboardPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.dashboard);
  }

  registerPages(router) {
    router.get(
      '/dashboard',
      needsAuthentication(),
      (req, res) => this.handleGetDashboardPage(req, res)
    );
  }
}

export default DashboardController;
