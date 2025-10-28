import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import StatisticsService from '../services/statistics-service.js';
import { validateParams } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { getTagDetailsParamsSchema } from '../domain/schemas/statistics-schemas.js';

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
    const { tags } = await this.statisticsService.getTagsWithUsageCounts();
    return res.send({ tags });
  }

  async handleGetTagDetails(req, res) {
    const { tag } = req.params;
    const tagDetails = await this.statisticsService.getTagUsageDetails({ tag });
    return res.send({ tagDetails });
  }

  async handleGetSearchRequests(req, res) {
    const searchRequests = await this.statisticsService.getSearchRequests();
    return res.send({ searchRequests });
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

    router.get(
      '/api/v1/statistics/tags/:tag',
      validateParams(getTagDetailsParamsSchema),
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetTagDetails(req, res)
    );

    router.get(
      '/api/v1/statistics/search-requests',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetSearchRequests(req, res)
    );
  }
}

export default StatisticsController;
