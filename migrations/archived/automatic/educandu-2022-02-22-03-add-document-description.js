/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_02_22_03_add_document_description {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { description: '' } });
    await this.db.collection('documents').updateMany({}, { $set: { description: '' } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { description: null } });
    await this.db.collection('documents').updateMany({}, { $unset: { description: null } });
  }
}
