import permissions from './permissions';

const basicFields = ['_id', 'username'];
const extendedFields = [...basicFields, 'email'];

export function getAllowedUserFields(forUser) {
  return permissions.hasUserPermission(forUser, permissions.SEE_USER_EMAIL)
    ? extendedFields
    : basicFields;
}

export default {
  getAllowedUserFields
};
