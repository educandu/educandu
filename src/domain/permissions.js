const roles = require('./roles');

const {
  USER,
  EDITOR,
  SUPER_USER,
  SUPER_EDITOR
} = roles;

const EDIT_DOC = 'edit-doc';
const VIEW_DOCS = 'view-docs';
const EDIT_MENU = 'edit-menu';
const VIEW_MENUS = 'view-menus';
const EDIT_FILE = 'edit-file';
const VIEW_FILES = 'view-files';
const CREATE_FILE = 'create-file';
const EDIT_USERS = 'edit-users';

const rolesForPermission = {
  [EDIT_DOC]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [VIEW_DOCS]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [EDIT_MENU]: [SUPER_USER, SUPER_EDITOR],
  [VIEW_MENUS]: [SUPER_USER, SUPER_EDITOR],
  [EDIT_FILE]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [VIEW_FILES]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [CREATE_FILE]: [SUPER_USER, SUPER_EDITOR, EDITOR, USER],
  [EDIT_USERS]: [SUPER_USER]
};

function hasUserPermission(user, permission) {
  return (rolesForPermission[permission] || []).some(r => roles.isUserInRole(user, r));
}

module.exports = {
  EDIT_DOC,
  VIEW_DOCS,
  EDIT_MENU,
  VIEW_MENUS,
  EDIT_FILE,
  VIEW_FILES,
  CREATE_FILE,
  EDIT_USERS,
  hasUserPermission
};
