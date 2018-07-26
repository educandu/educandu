module.exports = {
  name: 'documents',
  indexes: [
    {
      name: '_updatedOn_',
      key: { updatedOn: -1 }
    }
  ]
};
