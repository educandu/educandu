import { ROLE } from './constants.js';

const ADMIN = 'admin';
const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const EDIT_FILE = 'edit-file';
const OWN_ROOMS = 'own-rooms';
const REVIEW_DOC = 'review-doc';
const VERIFY_DOC = 'verify-doc';
const VIEW_FILES = 'view-files';
const JOIN_ROOMS = 'join-rooms';
const CREATE_FILE = 'create-file';
const ARCHIVE_DOC = 'archive-doc';
const MIGRATE_DATA = 'migrate-data';
const SEARCH_USERS = 'search-users';
const MANAGE_USERS = 'manage-users';
const MANAGE_BATCHES = 'manage-batches';
const SEE_USER_EMAIL = 'see-user-email';
const MANAGE_CONTENT = 'manage-content';
const PROTECT_ANY_DOC = 'protect-any-doc';
const PROTECT_OWN_DOC = 'protect-own-doc';
const MANAGE_SETTINGS = 'manage-settings';
const DELETE_OWN_FILES = 'delete-own-files';
const HARD_DELETE_SECTION = 'hard-delete-section';
const DELETE_FOREIGN_ROOMS = 'delete-foreign-rooms';
const MANAGE_STORAGE_PLANS = 'manage-storage-plans';
const DELETE_ANY_STORAGE_FILE = 'delete-storage-file';
const RESTORE_DOC_REVISIONS = 'restore-doc-revisions';
const CREATE_DOCUMENT_COMMENTS = 'create-document-comments';
const MANAGE_DOCUMENT_COMMENTS = 'manage-document-comments';
const AUTORIZE_ROOMS_RESOURCES = 'authorize-room-resources';
const MANAGE_ACCREDITED_EDITORS = 'manage-accredited-editors';

const userPermissions = [
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_FILE,
  VIEW_FILES,
  DELETE_OWN_FILES,
  CREATE_FILE,
  OWN_ROOMS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_ROOMS,
  CREATE_DOCUMENT_COMMENTS
];

const accreditedAuthorPermissions = [
  ...userPermissions,
  PROTECT_OWN_DOC
];

const maintainerPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    HARD_DELETE_SECTION,
    DELETE_ANY_STORAGE_FILE,
    SEARCH_USERS,
    SEE_USER_EMAIL,
    RESTORE_DOC_REVISIONS,
    ARCHIVE_DOC,
    REVIEW_DOC,
    VERIFY_DOC,
    PROTECT_ANY_DOC,
    MANAGE_DOCUMENT_COMMENTS,
    MANAGE_CONTENT,
    MANAGE_ACCREDITED_EDITORS
  ])
];

const adminPermissions = [
  ...new Set([
    ...userPermissions,
    ...accreditedAuthorPermissions,
    ...maintainerPermissions,
    ADMIN,
    MANAGE_USERS,
    MANAGE_BATCHES,
    MIGRATE_DATA,
    MANAGE_SETTINGS,
    MANAGE_STORAGE_PLANS,
    DELETE_FOREIGN_ROOMS
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
  ADMIN,
  EDIT_DOC,
  VIEW_DOCS,
  REVIEW_DOC,
  VERIFY_DOC,
  PROTECT_ANY_DOC,
  PROTECT_OWN_DOC,
  EDIT_FILE,
  VIEW_FILES,
  DELETE_OWN_FILES,
  CREATE_FILE,
  SEARCH_USERS,
  MANAGE_USERS,
  MANAGE_BATCHES,
  MANAGE_SETTINGS,
  MANAGE_STORAGE_PLANS,
  HARD_DELETE_SECTION,
  SEE_USER_EMAIL,
  MIGRATE_DATA,
  ARCHIVE_DOC,
  RESTORE_DOC_REVISIONS,
  DELETE_ANY_STORAGE_FILE,
  OWN_ROOMS,
  DELETE_FOREIGN_ROOMS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_ROOMS,
  CREATE_DOCUMENT_COMMENTS,
  MANAGE_DOCUMENT_COMMENTS,
  MANAGE_CONTENT,
  MANAGE_ACCREDITED_EDITORS
};
