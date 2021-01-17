export default {
  name: 'documents',
  indexes: [
    {
      name: '_idx_updatedOn_',
      key: { updatedOn: -1 }
    },
    {
      name: '_idx_namespace_slug_',
      key: { namespace: 1, slug: 1 }
    }
  ]
};
