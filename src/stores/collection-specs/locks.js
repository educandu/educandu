export default {
  name: 'locks',
  indexes: [
    {
      name: '_idx_type_key_',
      key: { type: 1, key: 1 },
      unique: true
    },
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    }
  ]
};
