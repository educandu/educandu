export default {
  name: 'roomInvitations',
  indexes: [
    {
      name: '_idx_expires_',
      key: { expires: 1 },
      expireAfterSeconds: 0
    },
    {
      name: '_idx_roomId_email_',
      key: { email: 1, roomId: 1 },
      unique: true
    }
  ]
};
