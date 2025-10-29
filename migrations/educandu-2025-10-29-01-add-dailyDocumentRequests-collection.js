export default class Educandu_2025_10_29_01_add_dailyDocumentRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('dailyDocumentRequests');
    await this.db.collection('dailyDocumentRequests').createIndexes([
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
    ]);
  }

  async down() {
    await this.db.dropCollection('dailyDocumentRequests');
  }
}
