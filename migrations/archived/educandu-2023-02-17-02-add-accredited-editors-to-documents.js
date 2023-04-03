export default class Educandu_2023_02_17_02_add_accredited_editors_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collection) {
    await collection.updateMany({ roomId: { $eq: null } }, { $set: { 'publicContext.accreditedEditors': [] } });
  }

  async collectionDown(collection) {
    await collection.updateMany({ roomId: { $eq: null } }, { $unset: { 'publicContext.accreditedEditors': null } });
  }

  async up() {
    await this.collectionUp(this.db.collection('documentRevisions'));
    await this.collectionUp(this.db.collection('documents'));
  }

  async down() {
    await this.collectionDown(this.db.collection('documentRevisions'));
    await this.collectionDown(this.db.collection('documents'));
  }
}
