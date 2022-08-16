import { ROLE } from './constants.js';

const ADMIN = 'admin';
const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const REVIEW_DOC = 'review-doc';
const VERIFY_DOC = 'verify-doc';
const EDIT_FILE = 'edit-file';
const VIEW_FILES = 'view-files';
const DELETE_OWN_FILES = 'delete-own-files';
const CREATE_FILE = 'create-file';
const EDIT_USERS = 'edit-users';
const VIEW_BATCHES = 'view-batches';
const HARD_DELETE_SECTION = 'hard-delete-section';
const DELETE_ANY_STORAGE_FILE = 'delete-storage-file';
const SEE_USER_EMAIL = 'see-user-email';
const MIGRATE_DATA = 'migrate-data';
const RESTORE_DOC_REVISIONS = 'restore-doc-revisions';
const MANAGE_ARCHIVED_DOCS = 'manage-archived-docs';
const MANAGE_IMPORT = 'manage-import';
const MANAGE_EXPORT_WITH_BUILT_IN_USER = 'manage-export-with-built-in-user';
const REQUEST_AMB_METADATA_WITH_BUILT_IN_USER = 'request-amb-metadata-with-built-in-user';
const MANAGE_SETTINGS = 'manage-settings';
const MANAGE_STORAGE_PLANS = 'manage-storage-plans';
const OWN_ROOMS = 'own-rooms';
const DELETE_FOREIGN_ROOMS = 'delete-foreign-rooms';
const AUTORIZE_ROOMS_RESOURCES = 'authorize-room-resources';
const JOIN_PRIVATE_ROOMS = 'join-private-rooms';

const userPermissions = [
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_FILE,
  VIEW_FILES,
  DELETE_OWN_FILES,
  CREATE_FILE,
  OWN_ROOMS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_PRIVATE_ROOMS
];

const maintainerPermissions = [
  ...new Set([
    ...userPermissions,
    HARD_DELETE_SECTION,
    DELETE_ANY_STORAGE_FILE,
    SEE_USER_EMAIL,
    RESTORE_DOC_REVISIONS,
    MANAGE_ARCHIVED_DOCS,
    REVIEW_DOC,
    VERIFY_DOC
  ])
];

const adminPermissions = [
  ...new Set([
    ...userPermissions,
    ...maintainerPermissions,
    ADMIN,
    EDIT_USERS,
    VIEW_BATCHES,
    MIGRATE_DATA,
    MANAGE_IMPORT,
    MANAGE_SETTINGS,
    MANAGE_STORAGE_PLANS,
    DELETE_FOREIGN_ROOMS
  ])
];

const permissionsPerRole = {
  [ROLE.user]: userPermissions,
  [ROLE.maintainer]: maintainerPermissions,
  [ROLE.admin]: adminPermissions
};

export function hasUserPermission(user, permission) {
  return user?.permissions
    ? user.permissions.includes(permission)
    : (user?.roles || []).some(role => permissionsPerRole[role].includes(permission));
}

export function getAllUserPermissions(user) {
  const directPermissions = user?.permissions || [];
  const permissionsBasedOnRoles = (user?.roles || []).map(role => [...permissionsPerRole[role]]).flat();

  return [...new Set([...directPermissions, ...permissionsBasedOnRoles])];
}

export default {
  ADMIN,
  EDIT_DOC,
  VIEW_DOCS,
  REVIEW_DOC,
  VERIFY_DOC,
  EDIT_FILE,
  VIEW_FILES,
  DELETE_OWN_FILES,
  CREATE_FILE,
  EDIT_USERS,
  VIEW_BATCHES,
  MANAGE_SETTINGS,
  MANAGE_STORAGE_PLANS,
  HARD_DELETE_SECTION,
  SEE_USER_EMAIL,
  MIGRATE_DATA,
  MANAGE_ARCHIVED_DOCS,
  RESTORE_DOC_REVISIONS,
  MANAGE_IMPORT,
  MANAGE_EXPORT_WITH_BUILT_IN_USER,
  REQUEST_AMB_METADATA_WITH_BUILT_IN_USER,
  DELETE_ANY_STORAGE_FILE,
  OWN_ROOMS,
  DELETE_FOREIGN_ROOMS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_PRIVATE_ROOMS
};
