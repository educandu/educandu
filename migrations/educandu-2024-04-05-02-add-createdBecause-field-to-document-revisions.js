export default class Educandu_2024_04_05_02_add_createdBecause_field_to_document_revisions {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany({}, { $set: { createdBecause: '' } });
  }

  async down() {
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { createdBecause: null } });
  }
}
