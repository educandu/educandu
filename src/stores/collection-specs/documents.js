export default {
  name: 'documents',
  indexes: [
    {
      name: '_idx_createdBy_',
      key: { createdBy: -1 }
    },
    {
      name: '_idx_updatedBy_',
      key: { updatedBy: -1 }
    },
    {
      name: '_idx_updatedOn_',
      key: { updatedOn: -1 }
    },
    {
      name: '_idx_slug_',
      key: { slug: 1 }
    },
    {
      name: '_idx_tags_',
      key: { tags: 1 }
    }
  ]
};
