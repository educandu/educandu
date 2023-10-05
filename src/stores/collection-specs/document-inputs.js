export default {
  name: 'documentInputs',
  indexes: [
    {
      name: '_idx_documentId_',
      key: { documentId: 1 }
    },
    {
      name: '_idx_createdBy_',
      key: { createdBy: 1 }
    }
  ]
};
