import permissions from './permissions.js';

export const exportUser = Object.freeze({
  _id: 'export-user',
  username: 'export-user',
  provider: 'builtin/export',
  roles: [],
  permissions: [permissions.MANAGE_EXPORT]
});

export const cdnAutorizationUser = Object.freeze({
  _id: 'cdn-authorization-user',
  username: 'cdn-authorization-user',
  provider: 'builtin/cdnAuthorization',
  roles: [],
  permissions: [permissions.AUTORIZE_ROOMS_RESOURCES]
});
