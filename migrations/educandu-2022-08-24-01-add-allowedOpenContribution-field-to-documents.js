export default class Educandu_2022_08_24_01_add_allowedOpenContribution_field_to_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { allowedOpenContribution: 'metadataAndContent' } });
    await this.db.collection('documents').updateMany({}, { $set: { allowedOpenContribution: 'metadataAndContent' } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { allowedOpenContribution: null } });
    await this.db.collection('documents').updateMany({}, { $unset: { allowedOpenContribution: null } });
  }
}
