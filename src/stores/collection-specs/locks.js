export default {
  name: 'locks',
  indexes: [
    {
      name: '_idx_type_key_',
      key: { type: 1, key: 1 },
      unique: true
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
