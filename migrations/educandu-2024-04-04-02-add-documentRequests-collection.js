export default class Educandu_2024_04_04_02_add_documentRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentRequests');
    await this.db.collection('documentRequests').createIndexes([
      {
        name: '_idx_documentId_createdOn_createdOnDayOfWeek_type_loggedInUser',
        key: { documentId: 1, createdOn: 1, createdOnDayOfWeek: 1, type: 1, loggedInUser: 1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentRequests');
  }
}
