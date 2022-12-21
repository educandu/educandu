import md5 from 'md5';
import uniqueId from './unique-id.js';

export function generateSessionId(req) {
  return `${md5(req.ip).slice(0, 4)}${uniqueId.create(4)}`;
}

export function isSessionValid(req) {
  if (!req.session) {
    return true;
  }

  return req.session.id.slice(0, 4) === md5(req.ip).slice(0, 4);
}
