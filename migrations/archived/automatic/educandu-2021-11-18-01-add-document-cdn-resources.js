// eslint-disable-next-line camelcase
export default class Educandu_2021_11_18_01_add_document_cdn_resources {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { cdnResources: [] } });
    await this.db.collection('documents').updateMany({}, { $set: { cdnResources: [] } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { cdnResources: '' } });
    await this.db.collection('documents').updateMany({}, { $unset: { cdnResources: '' } });
  }
}
