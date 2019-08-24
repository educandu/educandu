const permissions = require('./permissions');

const basicFields = ['_id', 'username'];
const extendedFields = [...basicFields, 'email'];

function getAllowedUserFields(forUser) {
  return permissions.hasUserPermission(forUser, permissions.SEE_USER_EMAIL)
    ? extendedFields
    : basicFields;
}

module.exports = {
  getAllowedUserFields
};
