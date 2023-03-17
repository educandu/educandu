import os from 'node:os';
import multer from 'multer';
import express from 'express';
import routes from '../utils/routes.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import uploadLimitExceededMiddleware from '../domain/upload-limit-exceeded-middleware.js';
import { validateBody, validateQuery, validateParams, validateFile } from '../domain/validation-middleware.js';
import {
  deleteRoomMediaParamsSchema,
  getAllOrPostRoomMediaParamsSchema,
  getStoragePlansQuerySchema,
  patchOrDeleteStoragePlanParamsSchema,
  patchStoragePlanBodySchema,
  postStoragePlanBodySchema
} from '../domain/schemas/storage-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

class StorageController {
  static dependencies = [StorageService, RoomService];

  constructor(storageService, roomService) {
    this.storageService = storageService;
    this.roomService = roomService;
  }

  async handleGetRoomMediaOverview(req, res) {
    const { user } = req;
    const roomMediaOverview = await this.storageService.getRoomMediaOverview({ user });
    return res.send(roomMediaOverview);
  }

  async handleGetAllRoomMedia(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const roomMedia = await this.storageService.getAllRoomMedia({ user, roomId });
    return res.send(roomMedia);
  }

  async handlePostRoomMedia(req, res) {
    const { user, file } = req;
    const { roomId } = req.params;
    const roomMedia = await this.storageService.createRoomMedia({ user, roomId, file });
    return res.status(201).send(roomMedia);
  }

  async handleDeleteRoomMedia(req, res) {
    const { user } = req;
    const { roomId, name } = req.params;
    const roomMedia = await this.storageService.deleteRoomMedia({ user, roomId, name });
    return res.send(roomMedia);
  }

  async handleGetStoragePlans(req, res) {
    const { includeAssignedUserCount } = req.query;
    const storagePlans = includeAssignedUserCount === true.toString()
      ? await this.storageService.getAllStoragePlansWithAssignedUserCount()
      : await this.storageService.getAllStoragePlans();
    return res.send(storagePlans);
  }

  async handlePostStoragePlan(req, res) {
    const { name, maxBytes } = req.body;
    const newStoragePlan = await this.storageService.createStoragePlan({ name, maxBytes });
    return res.status(201).send(newStoragePlan);
  }

  async handlePatchStoragePlan(req, res) {
    const { storagePlanId } = req.params;
    const { name, maxBytes } = req.body;
    const updatedStoragePlan = await this.storageService.updateStoragePlan(storagePlanId, { name, maxBytes });
    return res.send(updatedStoragePlan);
  }

  async handleDeleteStoragePlan(req, res) {
    const { storagePlanId } = req.params;
    await this.storageService.deleteStoragePlanById(storagePlanId);
    return res.send({});
  }

  registerBeforePages(router) {
    router.use(async (req, _res, next) => {
      try {
        const { user } = req;
        const documentId = routes.getDocIdIfDocUrl(req.originalUrl);

        // eslint-disable-next-line require-atomic-updates
        req.storage = await this.storageService.getRoomStorage({ user, documentId });

        let storagePlan;
        if (user?.storage.planId) {
          storagePlan = await this.storageService.getStoragePlanById(user.storage.planId);
        }

        // eslint-disable-next-line require-atomic-updates
        req.storagePlan = storagePlan || null;

        return next();
      } catch (err) {
        return next(err);
      }
    });
  }

  registerApi(router) {
    router.get(
      '/api/v1/storage/room-media-overview',
      needsPermission(permissions.BROWSE_STORAGE),
      (req, res) => this.handleGetRoomMediaOverview(req, res)
    );

    router.get(
      '/api/v1/storage/room-media/:roomId',
      needsPermission(permissions.BROWSE_STORAGE),
      validateParams(getAllOrPostRoomMediaParamsSchema),
      (req, res) => this.handleGetAllRoomMedia(req, res)
    );

    router.post(
      '/api/v1/storage/room-media/:roomId',
      needsPermission(permissions.CREATE_CONTENT),
      uploadLimitExceededMiddleware(),
      multipartParser.single('file'),
      validateFile('file'),
      validateParams(getAllOrPostRoomMediaParamsSchema),
      (req, res) => this.handlePostRoomMedia(req, res)
    );

    router.delete(
      '/api/v1/storage/room-media/:roomId/:name',
      needsPermission(permissions.DELETE_OWN_PRIVATE_CONTENT),
      validateParams(deleteRoomMediaParamsSchema),
      (req, res) => this.handleDeleteRoomMedia(req, res)
    );

    router.get(
      '/api/v1/storage/plans',
      needsPermission(permissions.MANAGE_SETUP),
      validateQuery(getStoragePlansQuerySchema),
      (req, res) => this.handleGetStoragePlans(req, res)
    );

    router.post(
      '/api/v1/storage/plans',
      needsPermission(permissions.MANAGE_SETUP),
      jsonParser,
      validateBody(postStoragePlanBodySchema),
      (req, res) => this.handlePostStoragePlan(req, res)
    );

    router.patch(
      '/api/v1/storage/plans/:storagePlanId',
      needsPermission(permissions.MANAGE_SETUP),
      jsonParser,
      validateParams(patchOrDeleteStoragePlanParamsSchema),
      validateBody(patchStoragePlanBodySchema),
      (req, res) => this.handlePatchStoragePlan(req, res)
    );

    router.delete(
      '/api/v1/storage/plans/:storagePlanId',
      needsPermission(permissions.MANAGE_SETUP),
      validateParams(patchOrDeleteStoragePlanParamsSchema),
      (req, res) => this.handleDeleteStoragePlan(req, res)
    );
  }
}

export default StorageController;
