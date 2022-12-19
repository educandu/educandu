export default class Educandu_2022_10_24_01_remove_origin_and_originUrl_from_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').updateMany({}, { $unset: { origin: null, originUrl: null } });
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { origin: null, originUrl: null } });
  }

  async down() {
    await this.db.collection('documents').updateMany({}, { $set: { origin: 'internal', originUrl: null } });
    await this.db.collection('documentRevisions').updateMany({}, { $set: { origin: 'internal', originUrl: null } });
  }
}
