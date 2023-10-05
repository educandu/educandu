export default {
  name: 'roomMediaItems',
  indexes: [
    {
      name: '_idx_roomId_',
      key: { roomId: 1 }
    },
    {
      name: '_idx_url_',
      key: { url: 1 },
      unique: true
    }
  ]
};
