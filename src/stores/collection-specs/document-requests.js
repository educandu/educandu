export default {
  name: 'documentRequests',
  indexes: [
    {
      name: '_idx_documentId_registeredOn_registeredOnDayOfWeek_isWriteRequest_isLoggedInRequest',
      key: { documentId: 1, registeredOn: 1, registeredOnDayOfWeek: 1, isWriteRequest: 1, isLoggedInRequest: 1 }
    }
  ]
};
