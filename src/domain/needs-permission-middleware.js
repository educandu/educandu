import httpErrors from 'http-errors';
import { hasUserPermission } from './permissions.js';

const { Unauthorized, Forbidden } = httpErrors;

function evaluatePermission(permission, req, res, next) {
  let value;
  let condition;
  if (permission && typeof permission === 'object') {
    value = permission.value;
    condition = permission.condition;
  } else {
    value = permission;
    condition = null;
  }

  if (condition && !condition(req)) {
    return next();
  }

  if (!req.isAuthenticated()) {
    return next(new Unauthorized());
  }

  if (!hasUserPermission(req.user, value)) {
    const forbidden = new Forbidden();
    forbidden.requiredPermission = value;
    return next(forbidden);
  }

  return next();
}

function needsPermission(permission) {
  return evaluatePermission.bind(null, permission);
}

export default needsPermission;
