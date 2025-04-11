export default {
  name: 'searchRequests',
  indexes: [
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
