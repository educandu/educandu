export const USER = 'user';
export const EDITOR = 'editor';
export const SUPER_USER = 'super-user';
export const SUPER_EDITOR = 'super-editor';

export function isUserInRole(user, role) {
  return user && user.roles && user.roles.includes(role);
}

export default {
  USER,
  EDITOR,
  SUPER_USER,
  SUPER_EDITOR,
  isUserInRole
};
