import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import BatchService from '../services/batch-service.js';
import { validateParams } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { batchIdParamsSchema } from '../domain/schemas/batch-schemas.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

const { NotFound } = httpErrors;

class BatchController {
  static get inject() { return [PageRenderer, BatchService, ClientDataMappingService]; }

  constructor(pageRenderer, batchService, clientDataMappingService) {
    this.batchService = batchService;
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetBatchPage(req, res) {
    const { batchId } = req.params;
    const rawBatch = await this.batchService.getBatchDetails(batchId);
    if (!rawBatch) {
      throw new NotFound(`Batch with ID '${batchId}' could not be found`);
    }

    const batch = await this.clientDataMappingService.mapBatch(rawBatch, req.user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.batches, { batch });
  }

  async handleGetBatch(req, res) {
    const { batchId } = req.params;
    const rawBatch = await this.batchService.getBatchDetails(batchId);
    const batch = await this.clientDataMappingService.mapBatch(rawBatch, req.user);

    res.send({ batch });
  }

  registerPages(app) {
    app.get(
      '/batches/:batchId',
      needsPermission(permissions.VIEW_BATCHES),
      validateParams(batchIdParamsSchema),
      (req, res) => this.handleGetBatchPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/batches/:batchId',
      needsPermission(permissions.VIEW_BATCHES),
      validateParams(batchIdParamsSchema),
      (req, res) => this.handleGetBatch(req, res)
    );
  }
}

export default BatchController;
