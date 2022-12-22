export default {
  name: 'users',
  indexes: [
    {
      name: '_idx_email_accountClosedOn_',
      key: { email: 1, accountClosedOn: 1 },
      unique: true,
      partialFilterExpression: { $and: [{ email: { $type: 'string' } }, { accountClosedOn: null }] }
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_verificationCode_',
      key: { verificationCode: 1 },
      unique: true,
      partialFilterExpression: { verificationCode: { $type: 'string' } }
    }
  ]
};
