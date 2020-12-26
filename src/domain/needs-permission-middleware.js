import permissions from './permissions';
import { Unauthorized, Forbidden } from 'http-errors';

function evaluatePermission(permission, req, res, next) {
  if (!req.isAuthenticated()) {
    return next(new Unauthorized());
  }

  if (!permissions.hasUserPermission(req.user, permission)) {
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
