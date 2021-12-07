// eslint-disable-next-line camelcase
export default class Educandu_2021_12_03_01_add_document_origin_url {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { originUrl: null } });
    await this.db.collection('documents').updateMany({}, { $set: { originUrl: null } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { originUrl: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { originUrl: '' } });
  }
}
