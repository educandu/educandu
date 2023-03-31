import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from './constants.js';

const { BadRequest } = httpErrors;

const SIZE_RESERVED_FOR_REMAINING_CONTENT_IN_BYTES = 500 * 1000;
const EFFECTIVE_REQUEST_LIMIT_IN_BYTES = STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES + SIZE_RESERVED_FOR_REMAINING_CONTENT_IN_BYTES;

function createUploadLimitExceededMiddleware() {
  return function uploadLimitExceededMiddleware(req, _res, next) {
    const requestSize = !!req.headers['content-length'] && Number(req.headers['content-length']);
    return requestSize && requestSize > EFFECTIVE_REQUEST_LIMIT_IN_BYTES
      ? next(new BadRequest(`Upload limit exceeded: limit ${prettyBytes(EFFECTIVE_REQUEST_LIMIT_IN_BYTES)}, requested ${prettyBytes(requestSize)}.`))
      : next();
  };
}

export default createUploadLimitExceededMiddleware;
