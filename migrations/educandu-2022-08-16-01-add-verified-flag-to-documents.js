/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_08_16_01_add_verified_flag_to_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { verified: false } });
    await this.db.collection('documents').updateMany({}, { $set: { verified: false } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { verified: false } });
    await this.db.collection('documents').updateMany({}, { $unset: { verified: false } });
  }
}
