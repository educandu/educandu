import { ROLE } from './constants.js';

const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const EDIT_FILE = 'edit-file';
const VIEW_FILES = 'view-files';
const CREATE_FILE = 'create-file';
const EDIT_USERS = 'edit-users';
const EDIT_SETTINGS = 'edit-settings';
const HARD_DELETE_SECTION = 'hard-delete-section';
const DELETE_CDN_FILE = 'delete-cdn-file';
const SEE_USER_EMAIL = 'see-user-email';
const MIGRATE_DATA = 'migrate-data';
const RESTORE_DOC_REVISIONS = 'restore-doc-revisions';
const MANAGE_ARCHIVED_DOCS = 'manage-archived-docs';
const MANAGE_IMPORT = 'manage-import';
const MANAGE_EXPORT = 'manage-export';
const OWN_ROOMS = 'own-rooms';
const AUTORIZE_ROOMS_RESOURCES = 'authorize-room-resouces';
const JOIN_PRIVATE_ROOMS = 'join-private-rooms';
const REGENERATE_DOCS = 'regenerate-docs';

const rolesForPermission = {
  [EDIT_DOC]: [ROLE.admin, ROLE.user],
  [VIEW_DOCS]: [ROLE.admin, ROLE.user],
  [EDIT_FILE]: [ROLE.admin, ROLE.user],
  [VIEW_FILES]: [ROLE.admin, ROLE.user],
  [CREATE_FILE]: [ROLE.admin, ROLE.user],
  [EDIT_SETTINGS]: [ROLE.admin],
  [EDIT_USERS]: [ROLE.admin],
  [HARD_DELETE_SECTION]: [ROLE.admin],
  [DELETE_CDN_FILE]: [ROLE.admin],
  [SEE_USER_EMAIL]: [ROLE.admin],
  [MIGRATE_DATA]: [ROLE.admin],
  [RESTORE_DOC_REVISIONS]: [ROLE.admin],
  [MANAGE_ARCHIVED_DOCS]: [ROLE.admin],
  [MANAGE_IMPORT]: [ROLE.admin],
  [OWN_ROOMS]: [ROLE.admin, ROLE.user],
  [AUTORIZE_ROOMS_RESOURCES]: [ROLE.admin, ROLE.user],
  [JOIN_PRIVATE_ROOMS]: [ROLE.admin, ROLE.user],
  [REGENERATE_DOCS]: [ROLE.admin]
};

export function hasUserPermission(user, permission) {
  return user?.permissions
    ? user.permissions.includes(permission)
    : (rolesForPermission[permission] || []).some(role => user?.roles?.includes(role));
}

export default {
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_FILE,
  VIEW_FILES,
  CREATE_FILE,
  EDIT_USERS,
  EDIT_SETTINGS,
  HARD_DELETE_SECTION,
  SEE_USER_EMAIL,
  MIGRATE_DATA,
  MANAGE_ARCHIVED_DOCS,
  RESTORE_DOC_REVISIONS,
  MANAGE_IMPORT,
  MANAGE_EXPORT,
  DELETE_CDN_FILE,
  OWN_ROOMS,
  AUTORIZE_ROOMS_RESOURCES,
  JOIN_PRIVATE_ROOMS,
  REGENERATE_DOCS
};
