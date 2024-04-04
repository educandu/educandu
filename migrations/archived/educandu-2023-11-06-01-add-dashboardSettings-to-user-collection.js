export default class Educandu_2023_11_06_01_add_dahsboardSettings_to_user_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { dashboardSettings: { rooms: { hiddenRooms: [] } } } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { dashboardSettings: null } });
  }
}
