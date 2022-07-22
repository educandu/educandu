import os from 'os';
import multer from 'multer';
import express from 'express';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import routes from '../utils/routes.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import { isRoomOwnerOrCollaborator } from '../utils/room-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getRoomIdFromPrivateStoragePath, getStorageLocationTypeForPath } from '../utils/storage-utils.js';
import {
  getCdnObjectsQuerySchema,
  postCdnObjectsBodySchema,
  deleteCdnObjectQuerySchema,
  getStoragePlansQuerySchema,
  postStoragePlanBodySchema,
  patchStoragePlanParamsSchema,
  deleteStoragePlanParamsSchema,
  patchStoragePlanBodySchema
} from '../domain/schemas/storage-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

const { BadRequest, Unauthorized } = httpErrors;

const uploadLimitExceededMiddleware = (req, res, next) => {
  const requestSize = !!req.headers['content-length'] && Number(req.headers['content-length']);
  return requestSize && requestSize > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES
    ? next(new Error(`Upload limit exceeded: limit ${prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES)}, requested ${prettyBytes(requestSize)}.`))
    : next();
};

class StorageController {
  static get inject() { return [StorageService, RoomService]; }

  constructor(storageService, roomService) {
    this.storageService = storageService;
    this.roomService = roomService;
  }

  async handleGetCdnObjects(req, res) {
    const { user } = req;
    const { parentPath, searchTerm, recursive } = req.query;

    await this._checkPathAccess(parentPath, user);

    const { parentDirectory, currentDirectory, objects } = await this.storageService.getObjects({
      parentPath,
      searchTerm: searchTerm || null,
      recursive: recursive === true.toString()
    });

    return res.send({ parentDirectory, currentDirectory, objects });
  }

  async handleDeleteCdnObject(req, res) {
    const { user } = req;
    const { path } = req.query;

    const { storageClaimingUserId } = await this._checkPathAccess(path, user);
    const { usedBytes } = await this.storageService.deleteObject({ path, storageClaimingUserId });

    return res.send({ usedBytes });
  }

  async handlePostCdnObject(req, res) {
    const { user, files } = req;
    const { parentPath } = req.body;

    if (!files?.length) {
      throw new BadRequest('No files provided');
    }

    const { storageClaimingUserId } = await this._checkPathAccess(parentPath, user);
    const { uploadedFiles, usedBytes } = await this.storageService.uploadFiles({ parentPath, files, storageClaimingUserId });

    return res.status(201).send({ uploadedFiles, usedBytes });
  }

  async _checkPathAccess(path, user) {
    const storageLocationType = getStorageLocationTypeForPath(path);
    if (storageLocationType === STORAGE_LOCATION_TYPE.unknown) {
      throw new BadRequest(`Invalid storage path '${path}'`);
    }

    let storageClaimingUserId;
    if (storageLocationType === STORAGE_LOCATION_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(path);
      const privateRoom = await this.roomService.getRoomById(roomId);

      if (!privateRoom) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room: privateRoom, userId: user._id })) {
        throw new Unauthorized(`User is not authorized to access room '${roomId}'`);
      }

      storageClaimingUserId = privateRoom.owner;
    } else {
      storageClaimingUserId = user._id;
    }

    return {
      storageLocationType,
      storageClaimingUserId
    };
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

  registerMiddleware(router) {
    router.use(async (req, _res, next) => {
      const { user } = req;
      const documentId = routes.getDocIdIfDocUrl(req.originalUrl);
      const locations = await this.storageService.getStorageLocations({ user, documentId });

      // eslint-disable-next-line require-atomic-updates
      req.storage = { locations };

      return next();
    });
  }

  registerApi(router) {
    router.get(
      '/api/v1/storage/objects',
      [
        needsPermission(permissions.VIEW_FILES),
        jsonParser,
        validateQuery(getCdnObjectsQuerySchema)
      ],
      (req, res) => this.handleGetCdnObjects(req, res)
    );

    router.delete(
      '/api/v1/storage/objects',
      [
        needsPermission(permissions.DELETE_OWN_FILES),
        validateQuery(deleteCdnObjectQuerySchema)
      ],
      (req, res) => this.handleDeleteCdnObject(req, res)
    );

    router.post(
      '/api/v1/storage/objects',
      [
        needsPermission(permissions.CREATE_FILE),
        uploadLimitExceededMiddleware,
        multipartParser.array('files'), validateBody(postCdnObjectsBodySchema)
      ],
      (req, res) => this.handlePostCdnObject(req, res)
    );

    router.get(
      '/api/v1/storage/plans',
      needsPermission(permissions.MANAGE_STORAGE_PLANS),
      validateQuery(getStoragePlansQuerySchema),
      (req, res) => this.handleGetStoragePlans(req, res)
    );

    router.post(
      '/api/v1/storage/plans',
      needsPermission(permissions.MANAGE_STORAGE_PLANS),
      jsonParser,
      validateBody(postStoragePlanBodySchema),
      (req, res) => this.handlePostStoragePlan(req, res)
    );

    router.patch(
      '/api/v1/storage/plans/:storagePlanId',
      needsPermission(permissions.MANAGE_STORAGE_PLANS),
      jsonParser,
      validateParams(patchStoragePlanParamsSchema),
      validateBody(patchStoragePlanBodySchema),
      (req, res) => this.handlePatchStoragePlan(req, res)
    );

    router.delete(
      '/api/v1/storage/plans/:storagePlanId',
      needsPermission(permissions.MANAGE_STORAGE_PLANS),
      validateParams(deleteStoragePlanParamsSchema),
      (req, res) => this.handleDeleteStoragePlan(req, res)
    );
  }
}

export default StorageController;
