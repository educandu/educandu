export default class Educandu_2023_03_27_01_add_shortDescription_to_users_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { shortDescription: '' } });
    await this.db.collection('users').updateMany({}, { $rename: { introduction: 'profileOverview' } });
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $unset: { shortDescription: null } });
    await this.db.collection('users').updateMany({}, { $rename: { profileOverview: 'introduction' } });
  }
}
