import permissions from './permissions.js';

export const exportUser = Object.freeze({
  _id: 'export-user',
  username: 'export-user',
  provider: 'builtin/export',
  roles: [],
  permissions: [permissions.MANAGE_EXPORT]
});

export const roomResourceAutorizationUser = Object.freeze({
  _id: 'room-resource-authorization-user',
  username: 'room-resource-authorization-user',
  provider: 'builtin/roomResourceAuthorization',
  roles: [],
  permissions: [permissions.AUTORIZE_ROOMS_RESOURCES]
});
