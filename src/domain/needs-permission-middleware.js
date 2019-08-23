const permissions = require('./permissions');
const { Unauthorized, Forbidden } = require('http-errors');

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

module.exports = function needsPermission(permission) {
  return evaluatePermission.bind(null, permission);
};
