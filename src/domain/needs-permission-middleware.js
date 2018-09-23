const permissions = require('./permissions');
const { UserNotAuthenticatedError, PermissionNotGrantedError } = require('./errors');

function evaluatePermission(permission, req, res, next) {
  if (!req.isAuthenticated()) {
    return next(new UserNotAuthenticatedError());
  }

  if (!permissions.hasUserPermission(req.user, permission)) {
    return next(new PermissionNotGrantedError({ permission }));
  }

  return next();
}

module.exports = function needsPermission(permission) {
  return evaluatePermission.bind(null, permission);
};
