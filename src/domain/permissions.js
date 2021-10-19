import { USER, EDITOR, SUPER_USER, SUPER_EDITOR, isUserInRole } from './roles';

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
  [EDIT_DOC]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [VIEW_DOCS]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [VIEW_MENUS]: [SUPER_USER, SUPER_EDITOR, EDITOR],
  [EDIT_MENU]: [SUPER_USER, SUPER_EDITOR, EDITOR],
  [EDIT_MENU_STRUCTURE]: [SUPER_USER, SUPER_EDITOR],
  [EDIT_FILE]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [VIEW_FILES]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [CREATE_FILE]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [EDIT_SETTINGS]: [SUPER_USER],
  [EDIT_USERS]: [SUPER_USER],
  [HARD_DELETE_SECTION]: [SUPER_USER],
  [SEE_USER_EMAIL]: [SUPER_USER],
  [MIGRATE_DATA]: [SUPER_USER]
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
