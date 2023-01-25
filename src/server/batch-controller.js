import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { BATCH_TYPE } from '../domain/constants.js';
import BatchService from '../services/batch-service.js';
import { validateParams } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { batchIdParamsSchema, batchTypeParamsSchema } from '../domain/schemas/batch-schemas.js';

const { NotFound } = httpErrors;

class BatchController {
  static get inject() { return [PageRenderer, BatchService, ClientDataMappingService]; }

  constructor(pageRenderer, batchService, clientDataMappingService) {
    this.batchService = batchService;
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetBatchPage(req, res) {
    const { user } = req;
    const { batchId } = req.params;
    const rawBatch = await this.batchService.getBatchDetails(batchId);
    if (!rawBatch) {
      throw new NotFound(`Batch with ID '${batchId}' could not be found`);
    }

    const batch = await this.clientDataMappingService.mapBatch(rawBatch, user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.batches, { batch });
  }

  async handleGetBatch(req, res) {
    const { user } = req;
    const { batchId } = req.params;
    const rawBatch = await this.batchService.getBatchDetails(batchId);
    const batch = await this.clientDataMappingService.mapBatch(rawBatch, user);

    res.send({ batch });
  }

  async handleGetLatestBatches(req, res) {
    const { user } = req;

    const latestBatchByType = Object.fromEntries(await Promise.all(Object.values(BATCH_TYPE).map(batchType => {
      return this.batchService.getLastBatch(batchType)
        .then(batch => batch ? this.clientDataMappingService.mapBatch(batch, user) : null)
        .then(batch => [batchType, batch]);
    })));

    res.send({ batches: latestBatchByType });
  }

  async handlePostBatchRequest(req, res) {
    const { user } = req;
    const { batchType } = req.params;
    const batch = await this.batchService.createBatch({ batchType, user });

    return res.status(201).send(batch);
  }

  registerPages(app) {
    app.get(
      '/batches/:batchId',
      needsPermission(permissions.MANAGE_BATCHES),
      validateParams(batchIdParamsSchema),
      (req, res) => this.handleGetBatchPage(req, res)
    );
  }

  registerApi(router) {
    router.get(
      '/api/v1/batches/:batchId',
      needsPermission(permissions.MANAGE_BATCHES),
      validateParams(batchIdParamsSchema),
      (req, res) => this.handleGetBatch(req, res)
    );

    router.get(
      '/api/v1/latest-batches',
      needsPermission(permissions.MANAGE_BATCHES),
      (req, res) => this.handleGetLatestBatches(req, res)
    );

    router.post(
      '/api/v1/batch-request/:batchType',
      needsPermission(permissions.MANAGE_BATCHES),
      validateParams(batchTypeParamsSchema),
      (req, res) => this.handlePostBatchRequest(req, res)
    );
  }
}

export default BatchController;
