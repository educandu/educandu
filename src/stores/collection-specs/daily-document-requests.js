export default {
  name: 'dailyDocumentRequests',
  indexes: [
    {
      name: '_idx_documentId_day_dayOfWeek_',
      key: { documentId: 1, day: 1, dayOfWeek: 1 },
      unique: true
    },
    {
      name: '_idx_expiresOn_',
      key: { expiresOn: 1 },
      expireAfterSeconds: 0
    }
  ]
};
