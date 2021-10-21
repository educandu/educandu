export function isUserInRole(user, role) {
  return user && user.roles && user.roles.includes(role);
}

export const ROLE = {
  user: 'user',
  editor: 'editor',
  superUser: 'super-user',
  superEditor: 'super-editor'
};

export default {
  ROLE,
  isUserInRole
};
