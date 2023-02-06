import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES } from './constants.js';

const { BadRequest } = httpErrors;

function createUploadLimitExceededMiddleware() {
  return function uploadLimitExceededMiddleware(req, _res, next) {
    const requestSize = !!req.headers['content-length'] && Number(req.headers['content-length']);
    return requestSize && requestSize > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES
      ? next(new BadRequest(`Upload limit exceeded: limit ${prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES)}, requested ${prettyBytes(requestSize)}.`))
      : next();
  };
}

export default createUploadLimitExceededMiddleware;
