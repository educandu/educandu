export default class Educandu_2022_09_13_01_rename_plan_to_planId_in_user_storage {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany(
      {},
      { $rename: { 'storage.plan': 'storage.planId' } }
    );
  }

  async down() {
    await this.db.collection('users').updateMany(
      {},
      { $rename: { 'storage.planId': 'storage.plan' } }
    );
  }
}
