export default class Educandu_2022_04_11_02_add_updatedBy_to_lessons {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('lessons').updateMany({}, [{ $set: { updatedBy: '$createdBy' } }]);
  }

  async down() {
    await this.db.collection('lessons').updateMany({}, { $unset: { updatedBy: null } });
  }
}
