import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import StatisticsService from '../services/statistics-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';

class StatisticsController {
  static dependencies = [StatisticsService, PageRenderer];

  constructor(statisticsService, pageRenderer) {
    this.statisticsService = statisticsService;
    this.pageRenderer = pageRenderer;
  }

  handleGetStatisticsPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.statistics);
  }

  async handleGetTags(req, res) {
    const tags = await this.statisticsService.getItemsWithTagsCount();
    return res.send({ tags });
  }

  registerPages(router) {
    router.get(
      '/statistics',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetStatisticsPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/statistics/tags',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetTags(req, res)
    );
  }
}

export default StatisticsController;
