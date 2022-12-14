export default class Educandu_2022_01_05_01_create_room_locks {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('roomLocks');
  }

  async down() {
    await this.db.dropCollection('roomLocks');
  }
}
