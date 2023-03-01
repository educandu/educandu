export default {
  name: 'notifications',
  indexes: [
    {
      name: '_idx_notifiedUserId_readOn_',
      key: { notifiedUserId: 1, readOn: 1 },
      partialFilterExpression: { readOn: null }
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
