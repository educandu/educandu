export default {
  name: 'documentCategories',
  indexes: [
    {
      name: '_idx_name_',
      key: { name: 1 },
      unique: true
    },
    {
      name: '_idx_documentIds_',
      key: { documentIds: 1 }
    }
  ]
};
