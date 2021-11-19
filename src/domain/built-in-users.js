import permissions from './permissions.js';

export const exchangeUser = Object.freeze({
  _id: 'exchange-user',
  username: 'exchange-user',
  provider: 'builtin/exchange',
  roles: [],
  permissions: [permissions.LIST_EXPORTABLE_CONTENT]
});
