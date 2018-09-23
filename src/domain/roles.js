const USER = 'user';
const EDITOR = 'editor';
const SUPER_USER = 'super-user';
const SUPER_EDITOR = 'super-editor';

function isUserInRole(user, role) {
  return user && user.roles && user.roles.includes(role);
}

module.exports = {
  USER,
  EDITOR,
  SUPER_USER,
  SUPER_EDITOR,
  isUserInRole
};
