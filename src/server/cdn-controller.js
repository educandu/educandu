import os from 'os';
import multer from 'multer';
import express from 'express';
import urls from '../utils/urls';
import parseBool from 'parseboolean';
import Cdn from '../repositories/cdn';
import permissions from '../domain/permissions';
import fileNameHelper from '../utils/file-name-helper';
import needsPermission from '../domain/needs-permission-middleware';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

class CdnController {
  static get inject() { return [Cdn]; }

  constructor(cdn) {
    this.cdn = cdn;
  }

  registerApi(router) {
    router.get('/api/v1/cdn/objects', [needsPermission(permissions.VIEW_FILES), jsonParser], async (req, res) => {
      const prefix = req.query.prefix;
      const recursive = parseBool(req.query.recursive);
      const objects = await this.cdn.listObjects({ prefix, recursive });
      return res.send({ objects });
    });

    router.post('/api/v1/cdn/objects', [needsPermission(permissions.CREATE_FILE), multipartParser.array('files')], async (req, res) => {
      if (req.files && req.files.length) {
        const uploads = req.files.map(file => {
          const fileName = urls.concatParts(req.body.prefix, file.originalname);
          const uniqueFileName = fileNameHelper.makeUnique(fileName);
          return this.cdn.uploadObject(uniqueFileName, file.path, {});
        });
        await Promise.all(uploads);
      } else if (req.body.prefix && req.body.prefix[req.body.prefix.length - 1] === '/') {
        // If no file but a prefix ending with `/` is provided, create a folder instead of a file:
        this.cdn.uploadEmptyObject(req.body.prefix, {});
      }

      return res.send({});
    });
  }
}

export default CdnController;
