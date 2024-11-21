export default {
  name: 'contactRequests',
  indexes: [
    {
      name: '_idx_fromUserId_toUserId_',
      key: { fromUserId: 1, toUserId: 1 },
      unique: true
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
