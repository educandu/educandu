import mime from 'mime';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Router } from 'express';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import { ensureIsArray } from '../utils/array-utils.js';
import permissions, { hasUserPermission } from './permissions.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from './constants.js';
import { createUniqueStorageFileName, getTemporaryUploadsPath } from '../utils/storage-utils.js';

const { BadRequest } = httpErrors;

const SIZE_RESERVED_FOR_REMAINING_CONTENT_IN_BYTES = 500 * 1000;
const EFFECTIVE_REQUEST_LIMIT_IN_BYTES = STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES + SIZE_RESERVED_FOR_REMAINING_CONTENT_IN_BYTES;

function createMultipartMiddleware({ cdn, fileField, bodyField = null, multipleFiles = false, allowUnlimitedUploadForElevatedRoles = false }) {
  const checkUploadLimitMiddleware = (req, _res, next) => {
    const requestSize = !!req.headers['content-length'] && Number(req.headers['content-length']);
    const allowUnrestricted = allowUnlimitedUploadForElevatedRoles && hasUserPermission(req.user, permissions.UPLOAD_WITHOUT_RESTRICTION);
    return requestSize && requestSize > EFFECTIVE_REQUEST_LIMIT_IN_BYTES && !allowUnrestricted
      ? next(new BadRequest(`Upload limit exceeded: limit ${prettyBytes(EFFECTIVE_REQUEST_LIMIT_IN_BYTES)}, requested ${prettyBytes(requestSize)}.`))
      : next();
  };

  const multipartParser = multer({
    storage: multerS3({
      s3: cdn.s3Client.client,
      bucket: cdn.bucketName,
      key: (_req, file, cb) => cb(null, `${getTemporaryUploadsPath()}/upload_${createUniqueStorageFileName(file.originalname)}`),
      contentType: (_req, file, cb) => cb(null, mime.getType(file.originalname)),
      metadata: (req, _file, cb) => cb(null, { createdOn: new Date().toString(), createdBy: req.user?._id || null })
    })
  });

  const multerMiddleware = multipleFiles
    ? multipartParser.array(`${fileField}[]`)
    : multipartParser.single(fileField);

  const checkFileExistsMiddleware = (req, _res, next) => {
    return !req[fileField]
      ? next(new BadRequest(`A file has to be provided in field '${fileField}'`))
      : next();
  };

  // This fixes the following multer-s3 bug: https://github.com/anacronw/multer-s3/issues/208
  const ensureCorrectFileSizeMiddleware = async (req, _res, next) => {
    try {
      const filesToCorrect = ensureIsArray(req[fileField]).filter(file => !file.size);
      for (const file of filesToCorrect) {
        const headResponse = await cdn.s3Client.headObject(cdn.bucketName, file.key);
        file.size = headResponse.ContentLength;
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };

  const transformBodyMiddleware = (req, _res, next) => {
    try {
      if (bodyField) {
        req.body = JSON.parse(req.body[bodyField] || 'null') || {};
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };

  return new Router().use([
    checkUploadLimitMiddleware,
    multerMiddleware,
    checkFileExistsMiddleware,
    ensureCorrectFileSizeMiddleware,
    transformBodyMiddleware
  ]);
}

export default createMultipartMiddleware;
