export default {
  name: 'lessons',
  indexes: [
    {
      name: '_idx_roomId_',
      key: { roomId: 1 }
    },
    {
      name: '_idx_created_by_',
      key: { createdBy: -1 }
    }
  ]
};
