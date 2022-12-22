export default {
  name: 'externalAccounts',
  indexes: [
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_providerKey_externalUserId_',
      key: { providerKey: 1, externalUserId: 1 },
      unique: true
    }
  ]
};
