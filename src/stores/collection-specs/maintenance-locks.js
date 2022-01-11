export default {
  name: 'maintenanceLocks',
  indexes: [
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    }
  ]
};
