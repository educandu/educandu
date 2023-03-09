import { ROLE } from './constants.js';

const VIEW_USERS = 'view-users';
const MANAGE_USERS = 'manage-users';
const MANAGE_SETUP = 'manage-setup';
const CREATE_CONTENT = 'create-content';
const BROWSE_STORAGE = 'browse-storage';
const BATCH_PROCESS_DATA = 'batch-process-data';
const MANAGE_PUBLIC_CONTENT = 'manage-public-content';
const PROTECT_OWN_PUBLIC_CONTENT = 'protect-own-public-content';
const DELETE_OWN_PRIVATE_CONTENT = 'delete-own-private-content';
const DELETE_ANY_PRIVATE_CONTENT = 'delete-any-private-content';

const userPermissions = [
  CREATE_CONTENT,
  BROWSE_STORAGE,
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
    MANAGE_PUBLIC_CONTENT
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
  return permissionsPerRole[user?.role]?.includes(permission);
}

export function getUserPermissions(user) {
  return permissionsPerRole[user?.role] || [];
}

export default {
  CREATE_CONTENT,
  BROWSE_STORAGE,
  DELETE_OWN_PRIVATE_CONTENT,
  PROTECT_OWN_PUBLIC_CONTENT,
  VIEW_USERS,
  MANAGE_PUBLIC_CONTENT,
  MANAGE_USERS,
  MANAGE_SETUP,
  BATCH_PROCESS_DATA,
  DELETE_ANY_PRIVATE_CONTENT
};
