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
      name: '_idx_searchTokens_',
      key: { searchTokens: 1 }
    },
    {
      name: '_idx_roomId_',
      key: { roomId: 1 }
    },
    {
      name: '_idx_contributors_',
      key: { contributors: 1 }
    },
    {
      name: '_idx_cdnResources_',
      key: { cdnResources: 1 }
    },
    {
      name: '_idx_trackedCdnResources_',
      key: { trackedCdnResources: 1 }
    }
  ]
};
