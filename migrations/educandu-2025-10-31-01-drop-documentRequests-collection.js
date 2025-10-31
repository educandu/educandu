export default class Educandu_2025_10_31_01_drop_documentRequests_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.dropCollection('documentRequests');
  }

  down() {
    throw new Error('Not supported');
  }
}
