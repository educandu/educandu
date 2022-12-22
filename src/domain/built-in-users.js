import permissions from './permissions.js';

export const ambMetadataUser = Object.freeze({
  _id: 'amb-metadata-user',
  displayName: 'amb-metadata-user',
  roles: [],
  permissions: [permissions.REQUEST_AMB_METADATA_WITH_BUILT_IN_USER],
  storage: {
    plan: null,
    usedBytes: 0,
    reminders: []
  }
});
