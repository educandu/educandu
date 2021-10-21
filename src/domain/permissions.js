import { ROLE, isUserInRole } from './roles';

export const EDIT_DOC = 'edit-doc';
export const VIEW_DOCS = 'view-docs';
export const EDIT_MENU = 'edit-menu';
export const VIEW_MENUS = 'view-menus';
export const EDIT_FILE = 'edit-file';
export const VIEW_FILES = 'view-files';
export const CREATE_FILE = 'create-file';
export const EDIT_USERS = 'edit-users';
export const EDIT_SETTINGS = 'edit-settings';
export const EDIT_MENU_STRUCTURE = 'edit-menu-structure';
export const HARD_DELETE_SECTION = 'hard-delete-section';
export const SEE_USER_EMAIL = 'see-user-email';
export const MIGRATE_DATA = 'migrate-data';

const rolesForPermission = {
  [EDIT_DOC]: [ROLE.superUser, ROLE.superEditor, ROLE.editor, ROLE.user],
  [VIEW_DOCS]: [ROLE.superUser, ROLE.superEditor, ROLE.editor, ROLE.user],
  [VIEW_MENUS]: [ROLE.superUser, ROLE.superEditor, ROLE.editor],
  [EDIT_MENU]: [ROLE.superUser, ROLE.superEditor, ROLE.editor],
  [EDIT_MENU_STRUCTURE]: [ROLE.superUser, ROLE.superEditor],
  [EDIT_FILE]: [ROLE.superUser, ROLE.superEditor, ROLE.editor, ROLE.user],
  [VIEW_FILES]: [ROLE.superUser, ROLE.superEditor, ROLE.editor, ROLE.user],
  [CREATE_FILE]: [ROLE.superUser, ROLE.superEditor, ROLE.editor, ROLE.user],
  [EDIT_SETTINGS]: [ROLE.superUser],
  [EDIT_USERS]: [ROLE.superUser],
  [HARD_DELETE_SECTION]: [ROLE.superUser],
  [SEE_USER_EMAIL]: [ROLE.superUser],
  [MIGRATE_DATA]: [ROLE.superUser]
};

export function hasUserPermission(user, permission) {
  return (rolesForPermission[permission] || []).some(r => isUserInRole(user, r));
}

export default {
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_MENU,
  VIEW_MENUS,
  EDIT_FILE,
  VIEW_FILES,
  CREATE_FILE,
  EDIT_USERS,
  EDIT_SETTINGS,
  EDIT_MENU_STRUCTURE,
  HARD_DELETE_SECTION,
  SEE_USER_EMAIL,
  MIGRATE_DATA,
  hasUserPermission
};
