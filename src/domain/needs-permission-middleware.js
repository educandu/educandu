import httpErrors from 'http-errors';
import { hasUserPermission } from './permissions.js';

const { Unauthorized, Forbidden } = httpErrors;

function evaluatePermission(permission, req, res, next) {
  if (!req.isAuthenticated()) {
    return next(new Unauthorized());
  }

  if (!hasUserPermission(req.user, permission)) {
    const forbidden = new Forbidden();
    forbidden.requiredPermission = permission;
    return next(forbidden);
  }

  return next();
}

function needsPermission(permission) {
  return evaluatePermission.bind(null, permission);
}

export default needsPermission;
