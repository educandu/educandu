import os from 'os';
import multer from 'multer';
import express from 'express';
import parseBool from 'parseboolean';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, ROOM_LESSONS_MODE } from '../domain/constants.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { STORAGE_PATH_TYPE, getStoragePathType, getRoomIdFromPrivateStoragePath } from '../ui/path-helper.js';
import {
  getObjectsQuerySchema,
  postObjectsBodySchema,
  deleteObjectQuerySchema,
  deleteObjectParamSchema,
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

  async handleGetCdnObject(req, res) {
    const prefix = req.query.prefix;
    const recursive = parseBool(req.query.recursive);
    const objects = await this.storageService.listObjects({ prefix, recursive });

    return res.send({ objects });
  }

  async handleDeleteCdnObject(req, res) {
    const { user } = req;
    const { prefix } = req.query;
    const { objectName } = req.params;

    const storagePathType = getStoragePathType(prefix);
    if (storagePathType === STORAGE_PATH_TYPE.unknown) {
      throw new BadRequest(`Invalid storage path '${prefix}'`);
    }

    let privateRoom;
    if (storagePathType === STORAGE_PATH_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(prefix);
      privateRoom = await this.roomService.getRoomById(roomId);

      if (!privateRoom) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room: privateRoom, userId: user._id })) {
        throw new Unauthorized(`User is not authorized to delete from room '${roomId}'`);
      }
    }
    const storageClaimingUserId = privateRoom?.owner || user._id;
    const { usedBytes } = await this.storageService.deleteObject({ prefix, objectName, userId: storageClaimingUserId });

    return res.send({ usedBytes });
  }

  async handlePostCdnObject(req, res) {
    const { user, files } = req;
    const { prefix } = req.body;
    const storagePathType = getStoragePathType(prefix);

    if (!files?.length) {
      throw new BadRequest('No files provided');
    }

    if (storagePathType === STORAGE_PATH_TYPE.unknown) {
      throw new BadRequest(`Invalid storage path '${prefix}'`);
    }

    let privateRoom;
    if (storagePathType === STORAGE_PATH_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(prefix);
      privateRoom = await this.roomService.getRoomById(roomId);

      if (!privateRoom) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (!isRoomOwnerOrCollaborator({ room: privateRoom, userId: user._id })) {
        throw new Unauthorized(`User is not authorized to upload to room '${roomId}'`);
      }
    }

    const storageClaimingUserId = privateRoom?.owner || user._id;
    const { usedBytes } = await this.storageService.uploadFiles({ prefix, files, userId: storageClaimingUserId });

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

  registerApi(router) {
    router.get(
      '/api/v1/storage/objects',
      [
        needsPermission(permissions.VIEW_FILES),
        jsonParser,
        validateQuery(getObjectsQuerySchema)
      ],
      (req, res) => this.handleGetCdnObject(req, res)
    );

    router.delete(
      '/api/v1/storage/objects/:objectName',
      [
        needsPermission(permissions.DELETE_STORAGE_FILE),
        validateQuery(deleteObjectQuerySchema),
        validateParams(deleteObjectParamSchema)
      ],
      (req, res) => this.handleDeleteCdnObject(req, res)
    );

    router.post(
      '/api/v1/storage/objects',
      [
        needsPermission(permissions.CREATE_FILE),
        uploadLimitExceededMiddleware,
        multipartParser.array('files'), validateBody(postObjectsBodySchema)
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
