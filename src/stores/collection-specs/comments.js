export default {
  name: 'comments',
  indexes: [
    {
      name: '_idx_documentId_',
      key: { documentId: 1 }
    }
  ]
};
