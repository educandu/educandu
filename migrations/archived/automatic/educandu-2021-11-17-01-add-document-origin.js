// eslint-disable-next-line camelcase
export default class Educandu_2021_11_17_01_add_document_origin {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { origin: 'internal' } });
    await this.db.collection('documents').updateMany({}, { $set: { origin: 'internal' } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { origin: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { origin: '' } });
  }
}
