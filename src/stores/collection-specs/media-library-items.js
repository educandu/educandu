export default {
  name: 'mediaLibraryItems',
  indexes: [
    {
      name: '_idx_resourceType_',
      key: { resourceType: 1 }
    },
    {
      name: '_idx_licenses_',
      key: { licenses: 1 }
    },
    {
      name: '_idx_tags_',
      key: { tags: 1 }
    }
  ]
};
