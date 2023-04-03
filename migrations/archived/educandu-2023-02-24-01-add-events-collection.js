export default class Educandu_2023_02_24_01_add_events_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('events');
  }

  async down() {
    await this.db.dropCollection('events');
  }
}
