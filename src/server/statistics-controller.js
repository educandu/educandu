import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import StatisticsService from '../services/statistics-service.js';
import { parseDate, parseDaysOfWeek } from '../utils/query-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import DocumentRequestService from '../services/document-request-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  getDocumentRequestsQuerySchema,
  getTagDetailsParamsSchema,
  getUserContributionsDetailsParamsSchema,
  getUserContributionsQuerySchema
} from '../domain/schemas/statistics-schemas.js';

class StatisticsController {
  static dependencies = [StatisticsService, PageRenderer, DocumentRequestService, ClientDataMappingService];

  constructor(statisticsService, pageRenderer, documentRequestService, clientDataMappingService) {
    this.statisticsService = statisticsService;
    this.pageRenderer = pageRenderer;
    this.documentRequestService = documentRequestService;
    this.clientDataMappingService = clientDataMappingService;
  }

  handleGetStatisticsPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.statistics);
  }

  async handleGetTags(req, res) {
    const tags = await this.statisticsService.getTagsWithUsageCounts();
    return res.send({ tags });
  }

  async handleGetTagDetails(req, res) {
    const { tag } = req.params;
    const tagDetails = await this.statisticsService.getTagUsageDetails({ tag });
    return res.send({ tagDetails });
  }

  async handleGetDocumentRequests(req, res) {
    const { registeredFrom, registeredUntil, daysOfWeek } = req.query;

    const parsedRegisteredFrom = parseDate(registeredFrom);
    const parsedRegisteredUntil = parseDate(registeredUntil);
    const parsedDaysOfWeek = parseDaysOfWeek(daysOfWeek);

    const documentRequestCounters = await this.documentRequestService.getAllDocumentRequestCounters({
      registeredFrom: parsedRegisteredFrom,
      registeredUntil: parsedRegisteredUntil,
      daysOfWeek: parsedDaysOfWeek
    });

    const mappedDocumentRequestCounters = await this.clientDataMappingService.mapDocumentRequestCounters({ documentRequestCounters });

    return res.send({ documentRequestCounters: mappedDocumentRequestCounters });
  }

  async handleGetSearchRequests(req, res) {
    const searchRequests = await this.statisticsService.getSearchRequests();
    return res.send({ searchRequests });
  }

  async handleGetUserContributions(req, res) {
    const { contributedFrom, contributedUntil } = req.query;

    const from = parseDate(contributedFrom);
    const until = parseDate(contributedUntil);

    const userContributions = await this.statisticsService.getUserContributions({ from, until });
    return res.send({ userContributions });
  }

  async handleGetUserContributionsDetails(req, res) {
    const { userId } = req.params;
    const { contributedFrom, contributedUntil } = req.query;

    const from = parseDate(contributedFrom);
    const until = parseDate(contributedUntil);

    const { contributions, documents } = await this.statisticsService.getUserContributionsDetails({ userId, from, until });
    return res.send({ contributions, documents });
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
      '/api/v1/statistics/document-requests',
      validateQuery(getDocumentRequestsQuerySchema),
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetDocumentRequests(req, res)
    );

    router.get(
      '/api/v1/statistics/search-requests',
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetSearchRequests(req, res)
    );

    router.get(
      '/api/v1/statistics/user-contributions',
      needsPermission(permissions.VIEW_STATISTICS),
      validateQuery(getUserContributionsQuerySchema),
      (req, res) => this.handleGetUserContributions(req, res)
    );

    router.get(
      '/api/v1/statistics/user-contributions/:userId',
      needsPermission(permissions.VIEW_STATISTICS),
      validateParams(getUserContributionsDetailsParamsSchema),
      validateQuery(getUserContributionsQuerySchema),
      (req, res) => this.handleGetUserContributionsDetails(req, res)
    );
  }
}

export default StatisticsController;
