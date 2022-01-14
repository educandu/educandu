export default {
  name: 'lessons',
  indexes: [
    {
      name: '_idx_roomId_',
      key: { roomId: 1 }
    }
  ]
};
