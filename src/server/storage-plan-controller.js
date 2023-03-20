import express from 'express';
import permissions from '../domain/permissions.js';
import StoragePlanService from '../services/storage-plan-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import {
  getStoragePlansQuerySchema,
  patchOrDeleteStoragePlanParamsSchema,
  patchStoragePlanBodySchema,
  postStoragePlanBodySchema
} from '../domain/schemas/storage-plan-schemas.js';

const jsonParser = express.json();

class StoragePlanController {
  static dependencies = [StoragePlanService];

  constructor(storagePlanService) {
    this.storagePlanService = storagePlanService;
  }

  async handleGetStoragePlans(req, res) {
    const { includeAssignedUserCount } = req.query;
    const storagePlans = includeAssignedUserCount === true.toString()
      ? await this.storagePlanService.getAllStoragePlansWithAssignedUserCount()
      : await this.storagePlanService.getAllStoragePlans();
    return res.send(storagePlans);
  }

  async handlePostStoragePlan(req, res) {
    const { name, maxBytes } = req.body;
    const newStoragePlan = await this.storagePlanService.createStoragePlan({ name, maxBytes });
    return res.status(201).send(newStoragePlan);
  }

  async handlePatchStoragePlan(req, res) {
    const { storagePlanId } = req.params;
    const { name, maxBytes } = req.body;
    const updatedStoragePlan = await this.storagePlanService.updateStoragePlan(storagePlanId, { name, maxBytes });
    return res.send(updatedStoragePlan);
  }

  async handleDeleteStoragePlan(req, res) {
    const { storagePlanId } = req.params;
    await this.storagePlanService.deleteStoragePlanById(storagePlanId);
    return res.send({});
  }

  registerApi(router) {
    router.get(
      '/api/v1/storage-plans',
      needsPermission(permissions.MANAGE_SETUP),
      validateQuery(getStoragePlansQuerySchema),
      (req, res) => this.handleGetStoragePlans(req, res)
    );

    router.post(
      '/api/v1/storage-plans',
      needsPermission(permissions.MANAGE_SETUP),
      jsonParser,
      validateBody(postStoragePlanBodySchema),
      (req, res) => this.handlePostStoragePlan(req, res)
    );

    router.patch(
      '/api/v1/storage-plans/:storagePlanId',
      needsPermission(permissions.MANAGE_SETUP),
      jsonParser,
      validateParams(patchOrDeleteStoragePlanParamsSchema),
      validateBody(patchStoragePlanBodySchema),
      (req, res) => this.handlePatchStoragePlan(req, res)
    );

    router.delete(
      '/api/v1/storage-plans/:storagePlanId',
      needsPermission(permissions.MANAGE_SETUP),
      validateParams(patchOrDeleteStoragePlanParamsSchema),
      (req, res) => this.handleDeleteStoragePlan(req, res)
    );
  }
}

export default StoragePlanController;
