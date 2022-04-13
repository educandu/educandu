/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2023_04_11_02_add_updatedBy_to_lessons {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('lessons').update({}, [{ $set: { updatedBy: '$createdBy' } }], { multi: true });
  }

  async down() {
    await this.db.collection('lessons').updateMany({}, { $unset: { updatedBy: null } });
  }
}
