export default {
  name: 'menus',
  indexes: [
    {
      name: '_idx_slug_',
      key: { slug: 1 }
    }
  ]
};
