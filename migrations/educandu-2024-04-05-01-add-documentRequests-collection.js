export default class Educandu_2024_04_05_01_add_documentRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('documentRequests');
    await this.db.collection('documentRequests').createIndexes([
      {
        name: '_idx_documentId_registeredOn_registeredOnDayOfWeek_type_isUserLoggedIn',
        key: { documentId: 1, registeredOn: 1, registeredOnDayOfWeek: 1, type: 1, isUserLoggedIn: 1 }
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('documentRequests');
  }
}
