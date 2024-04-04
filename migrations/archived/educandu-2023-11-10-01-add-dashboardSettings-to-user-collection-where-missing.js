export default class Educandu_2023_11_10_01_add_dahsboardSettings_to_user_collection_where_missing {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany(
      { dashboardSettings: { $exists: false } },
      { $set: { dashboardSettings: { rooms: { hiddenRooms: [] } } } }
    );
  }

  async down() {
    await this.db.collection('users').updateMany(
      {},
      { $unset: { dashboardSettings: null } }
    );
  }
}
