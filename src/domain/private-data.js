import permissions, { hasUserPermission } from './permissions.js';

const basicFields = ['_id', 'username'];
const extendedFields = [...basicFields, 'email'];

export function getAllowedUserFields(forUser) {
  return hasUserPermission(forUser, permissions.SEE_USER_EMAIL)
    ? extendedFields
    : basicFields;
}

export default {
  getAllowedUserFields
};
