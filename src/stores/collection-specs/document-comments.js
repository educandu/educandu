export default {
  name: 'documentComments',
  indexes: [
    {
      name: '_idx_documentId_',
      key: { documentId: 1 }
    },
    {
      name: '_idx_documentId_deletedOn_',
      key: { documentId: 1, deletedOn: 1 },
      partialFilterExpression: { $and: [{ documentId: { $type: 'string' } }, { deletedOn: null }] }
    }
  ]
};
