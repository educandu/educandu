import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { validateQuery } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { paginationSchema } from '../domain/schemas/shared-schemas.js';
import RecentContributionsService from './recent-contributions-service.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class RecentContributionsController {
  static dependencies = [RecentContributionsService, ClientDataMappingService, PageRenderer];

  constructor(recentContributionsService, clientDataMappingService, pageRenderer) {
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
    this.recentContributionsService = recentContributionsService;
  }

  handleGetRecentContributionsPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.recentContributions);
  }

  async handleGetRecentDocuments(req, res) {
    const { user } = req;
    const page = Number(req.query.page);
    const pageSize = Number(req.query.pageSize);

    const { documents, totalCount } = await this.recentContributionsService.getRecentDocuments({ page, pageSize });
    const mappedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(documents, user);

    return res.send({ documents: mappedDocuments, documentsTotalCount: totalCount });
  }

  registerPages(router) {
    router.get(
      '/recent-contributions',
      needsPermission(permissions.CREATE_CONTENT),
      (req, res) => this.handleGetRecentContributionsPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/recent-contributions/documents',
      validateQuery(paginationSchema),
      (req, res) => this.handleGetRecentDocuments(req, res)
    );
  }
}

export default RecentContributionsController;
