import { ROLE } from './role.js';

const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const EDIT_FILE = 'edit-file';
const VIEW_FILES = 'view-files';
const CREATE_FILE = 'create-file';
const EDIT_USERS = 'edit-users';
const EDIT_SETTINGS = 'edit-settings';
const HARD_DELETE_SECTION = 'hard-delete-section';
const SEE_USER_EMAIL = 'see-user-email';
const MIGRATE_DATA = 'migrate-data';
const RESTORE_DOC_REVISIONS = 'restore-doc-revisions';
const MANAGE_ARCHIVED_DOCS = 'manage-archived-docs';
const LIST_EXPORTABLE_CONTENT = 'list-exportable-content';

const rolesForPermission = {
  [EDIT_DOC]: [ROLE.admin, ROLE.user],
  [VIEW_DOCS]: [ROLE.admin, ROLE.user],
  [EDIT_FILE]: [ROLE.admin, ROLE.user],
  [VIEW_FILES]: [ROLE.admin, ROLE.user],
  [CREATE_FILE]: [ROLE.admin, ROLE.user],
  [EDIT_SETTINGS]: [ROLE.admin],
  [EDIT_USERS]: [ROLE.admin],
  [HARD_DELETE_SECTION]: [ROLE.admin],
  [SEE_USER_EMAIL]: [ROLE.admin],
  [MIGRATE_DATA]: [ROLE.admin],
  [RESTORE_DOC_REVISIONS]: [ROLE.admin],
  [MANAGE_ARCHIVED_DOCS]: [ROLE.admin]
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
  LIST_EXPORTABLE_CONTENT
};
