import { ROLE } from './constants.js';

const VIEW_USERS = 'view-users';
const MANAGE_USERS = 'manage-users';
const MANAGE_SETUP = 'manage-setup';
const CREATE_CONTENT = 'create-content';
const ACCESS_STORAGE = 'access-storage';
const BATCH_PROCESS_DATA = 'batch-process-data';
const MANAGE_PUBLIC_CONTENT = 'manage-public-content';
const PROTECT_OWN_PUBLIC_CONTENT = 'protect-own-public-content';
const DELETE_OWN_PRIVATE_CONTENT = 'delete-own-private-content';
const DELETE_ANY_PRIVATE_CONTENT = 'delete-any-private-content';
const MANAGE_PROTECTORS_OF_OWN_PUBLIC_CONTENT = 'manage-protectors-of-own-public-content';

const userPermissions = [
  CREATE_CONTENT,
  ACCESS_STORAGE,
  DELETE_OWN_PRIVATE_CONTENT
];

const accreditedAuthorPermissions = [
  ...userPermissions,
  PROTECT_OWN_PUBLIC_CONTENT
];

const maintainerPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    VIEW_USERS,
    MANAGE_PUBLIC_CONTENT,
    MANAGE_PROTECTORS_OF_OWN_PUBLIC_CONTENT
  ])
];

const adminPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    ...maintainerPermissions,
    MANAGE_USERS,
    MANAGE_SETUP,
    BATCH_PROCESS_DATA,
    DELETE_ANY_PRIVATE_CONTENT
  ])
];

const permissionsPerRole = {
  [ROLE.user]: userPermissions,
  [ROLE.accreditedAuthor]: accreditedAuthorPermissions,
  [ROLE.maintainer]: maintainerPermissions,
  [ROLE.admin]: adminPermissions
};

export function hasUserPermission(user, permission) {
  return (user?.roles || []).some(role => permissionsPerRole[role].includes(permission));
}

export function getAllUserPermissions(user) {
  const permissionsFromAllRoles = (user?.roles || []).map(role => [...permissionsPerRole[role]]).flat();
  return [...new Set([...permissionsFromAllRoles])];
}

export default {
  CREATE_CONTENT,
  ACCESS_STORAGE,
  DELETE_OWN_PRIVATE_CONTENT,
  PROTECT_OWN_PUBLIC_CONTENT,
  VIEW_USERS,
  MANAGE_PUBLIC_CONTENT,
  MANAGE_PROTECTORS_OF_OWN_PUBLIC_CONTENT,
  MANAGE_USERS,
  MANAGE_SETUP,
  BATCH_PROCESS_DATA,
  DELETE_ANY_PRIVATE_CONTENT
};
