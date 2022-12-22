export default {
  name: 'passwordResetRequests',
  indexes: [
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_userId_',
      key: { userId: 1 },
      unique: true
    }
  ]
};
