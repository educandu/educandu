import { ROLE } from './constants.js';

const ADMIN = 'admin';
const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const EDIT_FILE = 'edit-file';
const VIEW_FILES = 'view-files';
const CREATE_FILE = 'create-file';
const EDIT_USERS = 'edit-users';
const VIEW_BATCHES = 'view-batches';
const HARD_DELETE_SECTION = 'hard-delete-section';
const DELETE_STORAGE_FILE = 'delete-storage-file';
const SEE_USER_EMAIL = 'see-user-email';
const MIGRATE_DATA = 'migrate-data';
const RESTORE_DOC_REVISIONS = 'restore-doc-revisions';
const MANAGE_ARCHIVED_DOCS = 'manage-archived-docs';
const MANAGE_IMPORT = 'manage-import';
const MANAGE_EXPORT_WITH_BUILT_IN_USER = 'manage-export-with-built-in-user';
const MANAGE_SETTINGS = 'manage-settings';
const MANAGE_STORAGE_PLANS = 'manage-storage-plans';
const OWN_ROOMS = 'own-rooms';
const DELETE_FOREIGN_ROOMS = 'delete-foreign-rooms';
const OWN_LESSONS = 'own-lessons';
const AUTORIZE_ROOMS_RESOURCES = 'authorize-room-resouces';
const JOIN_PRIVATE_ROOMS = 'join-private-rooms';

const rolesForPermission = {
  [ADMIN]: [ROLE.admin],
  [EDIT_DOC]: [ROLE.admin, ROLE.user],
  [VIEW_DOCS]: [ROLE.admin, ROLE.user],
  [EDIT_FILE]: [ROLE.admin, ROLE.user],
  [VIEW_FILES]: [ROLE.admin, ROLE.user],
  [CREATE_FILE]: [ROLE.admin, ROLE.user],
  [EDIT_USERS]: [ROLE.admin],
  [VIEW_BATCHES]: [ROLE.admin],
  [HARD_DELETE_SECTION]: [ROLE.admin],
  [DELETE_STORAGE_FILE]: [ROLE.admin],
  [SEE_USER_EMAIL]: [ROLE.admin],
  [MIGRATE_DATA]: [ROLE.admin],
  [RESTORE_DOC_REVISIONS]: [ROLE.admin],
  [MANAGE_ARCHIVED_DOCS]: [ROLE.admin],
  [MANAGE_IMPORT]: [ROLE.admin],
  [MANAGE_EXPORT_WITH_BUILT_IN_USER]: [],
  [MANAGE_SETTINGS]: [ROLE.admin],
  [MANAGE_STORAGE_PLANS]: [ROLE.admin],
  [OWN_ROOMS]: [ROLE.admin, ROLE.user],
  [DELETE_FOREIGN_ROOMS]: [ROLE.admin],
  [OWN_LESSONS]: [ROLE.admin, ROLE.user],
  [AUTORIZE_ROOMS_RESOURCES]: [ROLE.admin, ROLE.user],
  [JOIN_PRIVATE_ROOMS]: [ROLE.admin, ROLE.user]
};

export function hasUserPermission(user, permission) {
  return user?.permissions
    ? user.permissions.includes(permission)
    : (rolesForPermission[permission] || []).some(role => user?.roles?.includes(role));
}

export default {
  ADMIN,
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_FILE,
  VIEW_FILES,
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
  DELETE_STORAGE_FILE,
  OWN_ROOMS,
  DELETE_FOREIGN_ROOMS,
  OWN_LESSONS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_PRIVATE_ROOMS
};
