export default {
  name: 'documentRevisions',
  indexes: [
    {
      name: '_idx_documentId_',
      key: { documentId: 1 }
    },
    {
      name: '_idx_order_',
      key: { order: 1 },
      unique: true
    },
    {
      name: '_idx_documentId_order_',
      key: { documentId: 1, order: 1 },
      unique: true
    }
  ]
};
