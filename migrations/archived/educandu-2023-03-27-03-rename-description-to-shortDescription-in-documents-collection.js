export default class Educandu_2023_03_27_03_rename_description_to_shortDescription_in_documents_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').updateMany({}, { $rename: { description: 'shortDescription' } });
    await this.db.collection('documentRevisions').updateMany({}, { $rename: { description: 'shortDescription' } });
  }

  async down() {
    await this.db.collection('documents').updateMany({}, { $rename: { shortDescription: 'description' } });
    await this.db.collection('documentRevisions').updateMany({}, { $rename: { shortDescription: 'description' } });
  }
}
