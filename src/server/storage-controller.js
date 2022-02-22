import os from 'os';
import multer from 'multer';
import express from 'express';
import parseBool from 'parseboolean';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { STORAGE_PATH_TYPE, getStoragePathType, getRoomIdFromPrivateStoragePath } from '../ui/path-helper.js';
import { getObjectsQuerySchema, postObjectsBodySchema, deleteObjectQuerySchema, deleteObjectParamSchema } from '../domain/schemas/storage-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

const { BadRequest, Unauthorized } = httpErrors;

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

    await this.storageService.deleteObject({ prefix, objectName, user });

    return res.sendStatus(200);
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

    if (storagePathType === STORAGE_PATH_TYPE.private) {
      const roomId = getRoomIdFromPrivateStoragePath(prefix);
      const room = await this.roomService.getRoomById(roomId);

      if (!room) {
        throw new BadRequest(`Unknown room id '${roomId}'`);
      }

      if (user._id !== room.owner) {
        throw new Unauthorized(`User is not authorized to upload to room '${roomId}'`);
      }
    }

    await this.storageService.uploadFiles({ prefix, files, user });
    return res.send({});
  }

  registerApi(router) {
    router.get(
      '/api/v1/storage/objects',
      [needsPermission(permissions.VIEW_FILES), jsonParser, validateQuery(getObjectsQuerySchema)],
      (req, res) => this.handleGetCdnObject(req, res)
    );

    router.delete(
      '/api/v1/storage/objects/:objectName',
      [needsPermission(permissions.DELETE_STORAGE_FILE), validateQuery(deleteObjectQuerySchema), validateParams(deleteObjectParamSchema)],
      (req, res) => this.handleDeleteCdnObject(req, res)
    );

    router.post(
      '/api/v1/storage/objects',
      [needsPermission(permissions.CREATE_FILE), multipartParser.array('files'), validateBody(postObjectsBodySchema)],
      (req, res) => this.handlePostCdnObject(req, res)
    );
  }
}

export default StorageController;
