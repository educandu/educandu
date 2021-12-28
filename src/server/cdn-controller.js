import os from 'os';
import multer from 'multer';
import express from 'express';
import urls from '../utils/urls.js';
import parseBool from 'parseboolean';
import Cdn from '../repositories/cdn.js';
import createHttpError from 'http-errors';
import permissions from '../domain/permissions.js';
import fileNameHelper from '../utils/file-name-helper.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateQuery, validateParams } from '../domain/validation-middleware.js';
import { getObjectsQuerySchema, postObjectsBodySchema, deleteObjectQuerySchema, deleteObjectParamSchema } from '../domain/schemas/cdn-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

class CdnController {
  static get inject() { return [Cdn]; }

  constructor(cdn) {
    this.cdn = cdn;
  }

  async handleGetCdnObject(req, res) {
    const prefix = req.query.prefix;
    const recursive = parseBool(req.query.recursive);
    const objects = await this.cdn.listObjects({ prefix, recursive });

    return res.send({ objects });
  }

  async handleDeleteCdnObject(req, res) {
    const prefix = req.query.prefix;
    const objectName = req.params.objectName;

    await this.cdn.deleteObject(urls.concatParts(prefix, objectName));

    return res.sendStatus(200);
  }

  async handlePostCdnObject(req, res) {
    if (req.files && req.files.length) {
      const uploads = req.files.map(async file => {
        const cdnFileName = fileNameHelper.buildCdnFileName(file.originalname, req.body.prefix);
        await this.cdn.uploadObject(cdnFileName, file.path, {});
      });
      await Promise.all(uploads);
    } else if (req.body.prefix && req.body.prefix[req.body.prefix.length - 1] === '/') {
      // If no file but a prefix ending with `/` is provided, create a folder instead of a file:
      await this.cdn.uploadEmptyObject(req.body.prefix, {});
    } else {
      createHttpError(400);
    }

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
