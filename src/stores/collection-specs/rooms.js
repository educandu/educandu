export default {
  name: 'rooms',
  indexes: [
    {
      name: '_idx_owner_',
      key: { owner: 1 }
    },
    {
      name: '_idx_members_user_id_',
      key: { 'members.userId': 1 }
    }
  ]
};
