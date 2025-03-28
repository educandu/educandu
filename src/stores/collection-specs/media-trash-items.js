export default {
  name: 'mediaTrashItems',
  indexes: [
    {
      name: '_idx_createdOn_',
      key: { createdOn: -1 }
    }
  ]
};
