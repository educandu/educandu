export default {
  name: 'documents',
  indexes: [
    {
      name: '_updatedOn_',
      key: { updatedOn: -1 }
    },
    {
      name: '_idx_slug_',
      key: { slug: 1 }
    }
  ]
};
