export default {
  name: 'passwordResetRequests',
  indexes: [
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_userId_',
      key: { userId: 1 },
      unique: true
    }
  ]
};
