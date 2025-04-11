import permissions from '../domain/permissions.js';
import { parseDate } from '../utils/query-utils.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import SearchRequestService from '../services/search-request-service.js';
import { getSearchRequestsForStatisticsQuerySchema } from '../domain/schemas/search-request-schemas.js';

class SearchRequestController {
  static dependencies = [SearchRequestService];

  constructor(searchRequestService) {
    this.searchRequestService = searchRequestService;
  }

  async handleGetSearchRequestsForStatistics(req, res) {
    const { registeredFrom, registeredUntil } = req.query;

    const parsedRegisteredFrom = parseDate(registeredFrom);
    const parsedRegisteredUntil = parseDate(registeredUntil);

    const searchRequestCounters = await this.searchRequestService.getSearchRequests({
      registeredFrom: parsedRegisteredFrom,
      registeredUntil: parsedRegisteredUntil
    });

    return res.send({ searchRequestCounters });
  }

  registerApi(router) {
    router.get(
      '/api/v1/search-requests/statistics',
      validateQuery(getSearchRequestsForStatisticsQuerySchema),
      needsPermission(permissions.VIEW_STATISTICS),
      (req, res) => this.handleGetSearchRequestsForStatistics(req, res)
    );
  }
}

export default SearchRequestController;
