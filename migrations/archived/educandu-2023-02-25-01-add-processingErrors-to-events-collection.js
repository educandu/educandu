export default class Educandu_2023_02_25_01_add_processingErrors_to_events_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('events').updateMany({}, { $set: { processingErrors: [] } });
  }

  async down() {
    await this.db.collection('events').updateMany({}, { $unset: { processingErrors: null } });
  }
}
