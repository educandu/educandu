import { ROLE } from './constants.js';

const BROWSE_USERS = 'browse-users';
const MANAGE_USERS = 'manage-users';
const MANAGE_SETUP = 'manage-setup';
const CREATE_CONTENT = 'create-content';
const BROWSE_STORAGE = 'browse-storage';
const VIEW_STATISTICS = 'view-statistics';
const BATCH_PROCESS_DATA = 'batch-process-data';
const MANAGE_PUBLIC_CONTENT = 'manage-public-content';
const DELETE_PUBLIC_CONTENT = 'delete-public-content';
const MANAGE_ASSIGNED_EDITORS = 'manage-assigned-editors';
const MANAGE_PROTECTED_CONTENT = 'manage-protected-content';
const MANAGE_DOCUMENT_CATEGORIES = 'manage-document-categories';
const PROTECT_OWN_PUBLIC_CONTENT = 'protect-own-public-content';
const DELETE_OWN_PRIVATE_CONTENT = 'delete-own-private-content';
const DELETE_ANY_PRIVATE_CONTENT = 'delete-any-private-content';
const UPLOAD_WITHOUT_RESTRICTION = 'upload-without-restriction';

const userPermissions = [
  CREATE_CONTENT,
  BROWSE_STORAGE,
  DELETE_OWN_PRIVATE_CONTENT
];

const accreditedAuthorPermissions = [
  ...userPermissions,
  PROTECT_OWN_PUBLIC_CONTENT
];

const editorPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    MANAGE_PUBLIC_CONTENT
  ])
];

const maintainerPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    ...editorPermissions,
    BROWSE_USERS,
    VIEW_STATISTICS,
    DELETE_PUBLIC_CONTENT,
    MANAGE_ASSIGNED_EDITORS,
    MANAGE_PROTECTED_CONTENT,
    MANAGE_DOCUMENT_CATEGORIES,
    UPLOAD_WITHOUT_RESTRICTION
  ])
];

const adminPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    ...editorPermissions,
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
  [ROLE.editor]: editorPermissions,
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
  BROWSE_USERS,
  MANAGE_USERS,
  MANAGE_SETUP,
  CREATE_CONTENT,
  BROWSE_STORAGE,
  VIEW_STATISTICS,
  BATCH_PROCESS_DATA,
  MANAGE_PUBLIC_CONTENT,
  DELETE_PUBLIC_CONTENT,
  MANAGE_ASSIGNED_EDITORS,
  MANAGE_PROTECTED_CONTENT,
  MANAGE_DOCUMENT_CATEGORIES,
  PROTECT_OWN_PUBLIC_CONTENT,
  DELETE_OWN_PRIVATE_CONTENT,
  DELETE_ANY_PRIVATE_CONTENT,
  UPLOAD_WITHOUT_RESTRICTION
};
