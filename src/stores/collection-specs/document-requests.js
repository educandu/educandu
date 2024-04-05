export default {
  name: 'documentRequests',
  indexes: [
    {
      name: '_idx_documentId_registeredOn_registeredOnDayOfWeek_type_isUserLoggedIn',
      key: { documentId: 1, registeredOn: 1, registeredOnDayOfWeek: 1, type: 1, isUserLoggedIn: 1 }
    }
  ]
};
