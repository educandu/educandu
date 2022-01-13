export default {
  name: 'roomLocks',
  indexes: [
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    }
  ]
};
