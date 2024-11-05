export default {
  name: 'contactRequests',
  indexes: [
    {
      name: '_idx_fromUserId_toUserId_',
      key: { fromUserId: 1, toUserId: 1 },
      unique: true
    },
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    }
  ]
};
