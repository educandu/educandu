const { BaseError } = require('make-error');
const errorCodes = require('./error-codes');

class UserNotAuthenticatedError extends BaseError {
  constructor() {
    super('User is not authenticated');
    this.code = errorCodes.ERR_USER_NOT_AUTHENTICATED;
  }
}

class PermissionNotGrantedError extends BaseError {
  constructor({ permission }) {
    super(`User does not have permission '${permission}'`);
    this.permission = permission;
    this.code = errorCodes.ERR_PERMISSION_NOT_GRANTED;
  }
}

module.exports = {
  UserNotAuthenticatedError,
  PermissionNotGrantedError
};
