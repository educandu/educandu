import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class StatisticsController {
  static dependencies = [PageRenderer];

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  handleGetStatisticsPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.statistics);
  }

  registerPages(router) {
    router.get(
      '/statistics',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetStatisticsPage(req, res)
    );
  }
}

export default StatisticsController;
