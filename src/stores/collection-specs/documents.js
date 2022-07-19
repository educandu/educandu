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
    },
    {
      name: '_idx_roomId_',
      key: { roomId: 1 }
    },
    {
      name: '_idx_access_',
      key: { access: 1 }
    },
    {
      name: '_idx_access_archived_',
      key: { access: 1, archived: 1 }
    }
  ]
};
