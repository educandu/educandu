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
    },
    {
      name: '_idx_searchTokens_',
      key: { searchTokens: 1 }
    },
    {
      name: '_idx_resourceType_name_tags_',
      key: { resourceType: 1, name: 1, tags: 1 }
    },
    {
      name: '_idx_url_',
      key: { url: 1 },
      unique: true
    }
  ]
};
