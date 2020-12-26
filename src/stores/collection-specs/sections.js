export default {
  name: 'sections',
  indexes: [
    {
      name: '_idx_key_',
      key: { key: 1 }
    },
    {
      name: '_idx_order_',
      key: { order: 1 },
      unique: true
    },
    {
      name: '_idx_key_order_',
      key: { key: 1, order: 1 },
      unique: true
    }
  ]
};
