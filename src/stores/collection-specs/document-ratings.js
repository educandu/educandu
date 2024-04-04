export default {
  name: 'documentRatings',
  indexes: [
    {
      name: '_idx_documentId_',
      key: { documentId: 1 },
      unique: true
    }
  ]
};
