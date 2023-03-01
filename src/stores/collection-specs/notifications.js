export default {
  name: 'notifications',
  indexes: [
    {
      name: '_idx_notifiedUserId_',
      key: { notifiedUserId: 1 }
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
