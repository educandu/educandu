export default {
  name: 'storagePlans',
  indexes: [
    {
      name: '_idx_name',
      key: { name: 1 },
      unique: true
    }
  ]
};
