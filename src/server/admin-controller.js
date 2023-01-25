import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { BATCH_TYPE } from '../domain/constants.js';
import requestUtils from '../utils/request-utils.js';
import BatchService from '../services/batch-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class AdminController {
  static get inject() { return [BatchService, ClientDataMappingService, PageRenderer]; }

  constructor(batchService, clientDataMappingService, pageRenderer) {
    this.batchService = batchService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetAdminPage(req, res) {
    const { user } = req;

    const [
      lastDocumentRegenerationBatch,
      lastDocumentValidationBatch,
      lastCdnResourcesConsolidationBatch,
      lastCdnUploadDirectoryCreationBatch
    ] = await Promise.all([
      this.batchService.getLastBatch(BATCH_TYPE.documentRegeneration),
      this.batchService.getLastBatch(BATCH_TYPE.documentValidation),
      this.batchService.getLastBatch(BATCH_TYPE.cdnResourcesConsolidation),
      this.batchService.getLastBatch(BATCH_TYPE.cdnUploadDirectoryCreation)
    ]);

    const initialState = {
      lastDocumentRegenerationBatch: lastDocumentRegenerationBatch
        ? await this.clientDataMappingService.mapBatch(lastDocumentRegenerationBatch, user)
        : null,
      lastDocumentValidationBatch: lastDocumentValidationBatch
        ? await this.clientDataMappingService.mapBatch(lastDocumentValidationBatch, user)
        : null,
      lastCdnResourcesConsolidationBatch: lastCdnResourcesConsolidationBatch
        ? await this.clientDataMappingService.mapBatch(lastCdnResourcesConsolidationBatch, user)
        : null,
      lastCdnUploadDirectoryCreationBatch: lastCdnUploadDirectoryCreationBatch
        ? await this.clientDataMappingService.mapBatch(lastCdnUploadDirectoryCreationBatch, user)
        : null
    };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.admin, initialState);
  }

  async handlePostDocumentRegenerationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createDocumentRegenerationBatch(user);

    return res.status(201).send(batch);
  }

  async handlePostDocumentValidationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createDocumentValidationBatch(user);

    return res.status(201).send(batch);
  }

  async handlePostCdnResourcesConsolidationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createCdnResourcesConsolidationBatch(user);

    return res.status(201).send(batch);
  }

  async handlePostCdnUploadDirectoryCreationRequest(req, res) {
    const { user } = req;
    const batch = await this.batchService.createCdnUploadDirectoryCreationBatch(user);

    return res.status(201).send(batch);
  }

  handleGetRequestInfoRequest(req, res) {
    return res.send(requestUtils.requestToPlainObject(req));
  }

  registerPages(router) {
    router.get(
      '/admin',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetAdminPage(req, res)
    );
  }

  registerApi(router) {
    router.post(
      '/api/v1/admin/document-regeneration',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostDocumentRegenerationRequest(req, res)
    );

    router.post(
      '/api/v1/admin/document-validation',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostDocumentValidationRequest(req, res)
    );

    router.post(
      '/api/v1/admin/cdn-resources-consolidation',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostCdnResourcesConsolidationRequest(req, res)
    );

    router.post(
      '/api/v1/admin/cdn-upload-directory-creation',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handlePostCdnUploadDirectoryCreationRequest(req, res)
    );

    router.get(
      '/api/v1/admin/request-info',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetRequestInfoRequest(req, res)
    );
  }
}

export default AdminController;
