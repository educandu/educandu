import os from 'os';
import multer from 'multer';
import express from 'express';
import parseBool from 'parseboolean';
import httpErrors from 'http-errors';
import permissions from '../domain/permissions.js';
import CdnService from '../services/cdn-service.js';
import RoomService from '../services/room-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { getObjectsQuerySchema, postObjectsBodySchema, deleteObjectQuerySchema, deleteObjectParamSchema } from '../domain/schemas/cdn-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

const { BadRequest, Unauthorized } = httpErrors;

class CdnController {
  static get inject() { return [CdnService, RoomService]; }

  constructor(cdnService, roomService) {
    this.cdnService = cdnService;
    this.roomService = roomService;
  }

  async handleGetCdnObject(req, res) {
    const prefix = req.query.prefix;
    const recursive = parseBool(req.query.recursive);
    const objects = await this.cdnService.listObjects({ prefix, recursive });

    return res.send({ objects });
  }

  async handleDeleteCdnObject(req, res) {
    const prefix = req.query.prefix;
    const objectName = req.params.objectName;

    await this.cdnService.deleteObject({ prefix, objectName });

    return res.sendStatus(200);
  }

  async handlePostCdnObject(req, res) {
    const { user } = req;
    const privateStorageMatch = req.body.prefix.match(/rooms\/(.+)\/media/);

    const isUploadingToPublicStorage = req.body.prefix.startsWith('media/');
    const isUploadingToPrivateStorage = !!privateStorageMatch;

    if (!req.files?.length) {
      throw new BadRequest('No files provided');
    }

    if (!isUploadingToPublicStorage && !isUploadingToPrivateStorage) {
      throw new BadRequest('Invalid storage path');
    }

    if (isUploadingToPrivateStorage) {
      const roomId = privateStorageMatch[1];
      const room = this.roomService.getRoomById(roomId);

      if (!room) {
        throw new BadRequest('Invalid room id');
      }

      if (user._id !== room.owner) {
        throw new Unauthorized();
      }
    }

    await this.cdnService.uploadFiles({ prefix: req.body.prefix, files: req.files });
    return res.send({});
  }

  registerApi(router) {
    router.get(
      '/api/v1/cdn/objects',
      [needsPermission(permissions.VIEW_FILES), jsonParser, validateQuery(getObjectsQuerySchema)],
      (req, res) => this.handleGetCdnObject(req, res)
    );

    router.delete(
      '/api/v1/cdn/objects/:objectName',
      [needsPermission(permissions.DELETE_CDN_FILE), validateQuery(deleteObjectQuerySchema), validateParams(deleteObjectParamSchema)],
      (req, res) => this.handleDeleteCdnObject(req, res)
    );

    router.post(
      '/api/v1/cdn/objects',
      [needsPermission(permissions.CREATE_FILE), multipartParser.array('files'), validateBody(postObjectsBodySchema)],
      (req, res) => this.handlePostCdnObject(req, res)
    );
  }
}

export default CdnController;
