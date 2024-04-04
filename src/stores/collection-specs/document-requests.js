export default {
  name: 'documentRequests',
  indexes: [
    {
      name: '_idx_documentId_createdOn_createdOnDayOfWeek_type_loggedInUser',
      key: { documentId: 1, createdOn: 1, createdOnDayOfWeek: 1, type: 1, loggedInUser: 1 }
    }
  ]
};
