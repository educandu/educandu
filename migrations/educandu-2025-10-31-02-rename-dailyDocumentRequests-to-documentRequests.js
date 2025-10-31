export default class Educandu_2025_10_31_02_rename_dailyDocumentRequests_to_documentRequests {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('dailyDocumentRequests').rename('documentRequests');
  }

  async down() {
    await this.db.collection('documentRequests').rename('dailyDocumentRequests');
  }
}
