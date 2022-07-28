/* eslint-disable camelcase, no-console */
export default class Educandu_2022_06_30_01_add_review_to_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, [{ $set: { review: '' } }]);
    await this.db.collection('documents').updateMany({}, [{ $set: { review: '' } }]);
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { updatedBy: null } });
    await this.db.collection('documents').updateMany({}, { $unset: { updatedBy: null } });
  }
}
