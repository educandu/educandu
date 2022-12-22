export default {
  name: 'roomInvitations',
  indexes: [
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_roomId_email_',
      key: { email: 1, roomId: 1 },
      unique: true
    },
    {
      name: '_idx_token_',
      key: { token: 1 },
      unique: true
    }
  ]
};
