export default class Educandu_2023_03_14_01_add_messages_to_rooms_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({}, { $set: { messages: [] } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { messages: null } });
  }
}
