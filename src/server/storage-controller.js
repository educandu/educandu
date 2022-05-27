import os from 'os';
import multer from 'multer';
import express from 'express';
import urls from '../utils/routes.js';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { getRoomIdFromPrivateStoragePath, getStorageLocationTypeForPath } from '../utils/storage-utils.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, ROOM_LESSONS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
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

const isRoomOwnerOrCollaborator = ({ room, userId }) => {
  const isOwner = room.owner === userId;
  const isCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.some(m => m.userId === userId);
  return isOwner || isCollaborator;
};

class StorageController {
  static get inject() { return [StorageService, RoomService]; }

  constructor(storageService, roomService) {
    this.storageService = storageService;
    this.roomService = roomService;
  }

  async handleGetCdnObjects(req, res) {
    const { parentPath } = req.query;
    const objects = await this.storageService.getObjects({ parentPath, recursive: false });
    return res.send({ objects });
  }

  async handleDeleteCdnObject(req, res) {
    const { user } = req;
    const { path } = req.query;

    const storageLocationType = getStorageLocationTypeForPath(path);
    if (storageLocationType === STORAGE_LOCATION_TYPE.unknown) {
      throw new BadRequest(`Invalid storage path '${path}'`);
    }

    let privateRoom = null;
    if (storageLocationType === STORAGE_LOCATION_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(path);
      privateRoom = await this.roomService.getRoomById(roomId);

      if (!privateRoom) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room: privateRoom, userId: user._id })) {
        throw new Unauthorized(`User is not authorized to delete from room '${roomId}'`);
      }
    }

    const storageClaimingUserId = privateRoom?.owner || user._id;
    const { usedBytes } = await this.storageService.deleteObject({ path, storageClaimingUserId });

    return res.send({ usedBytes });
  }

  async handlePostCdnObject(req, res) {
    const { user, files } = req;
    const { parentPath } = req.body;
    const storageLocationType = getStorageLocationTypeForPath(parentPath);

    if (!files?.length) {
      throw new BadRequest('No files provided');
    }

    if (storageLocationType === STORAGE_LOCATION_TYPE.unknown) {
      throw new BadRequest(`Invalid storage path '${parentPath}'`);
    }

    let privateRoom;
    if (storageLocationType === STORAGE_LOCATION_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(parentPath);
      privateRoom = await this.roomService.getRoomById(roomId);

      if (!privateRoom) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room: privateRoom, userId: user._id })) {
        throw new Unauthorized(`User is not authorized to upload to room '${roomId}'`);
      }
    }

    const storageClaimingUserId = privateRoom?.owner || user._id;
    const { usedBytes } = await this.storageService.uploadFiles({ parentPath, files, storageClaimingUserId });

    return res.status(201).send({ usedBytes });
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
      const documentId = urls.getDocIdIfDocUrl(req.originalUrl);
      const lessonId = urls.getLessonIdIfLessonUrl(req.originalUrl);
      const locations = await this.storageService.getStorageLocations({ user, documentId, lessonId });

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
