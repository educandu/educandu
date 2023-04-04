export default {
  name: 'rooms',
  indexes: [
    {
      name: '_idx_ownedBy_',
      key: { ownedBy: 1 }
    },
    {
      name: '_idx_created_by_',
      key: { createdBy: -1 }
    },
    {
      name: '_idx_updated_by_',
      key: { updatedBy: -1 }
    },
    {
      name: '_idx_members_user_id_',
      key: { 'members.userId': 1 }
    },
    {
      name: '_idx_members_user_id_desc_',
      key: { 'members.userId': -1 }
    }
  ]
};
