import permissions from './permissions.js';

export const exportUser = Object.freeze({
  _id: 'export-user',
  username: 'export-user',
  provider: 'builtin/export',
  roles: [],
  permissions: [permissions.MANAGE_EXPORT_WITH_BUILT_IN_USER],
  storage: {
    plan: null,
    usedBytes: 0,
    reminders: []
  }
});
