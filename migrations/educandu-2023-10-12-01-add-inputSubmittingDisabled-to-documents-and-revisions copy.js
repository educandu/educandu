export default class Educandu_2023_10_12_01_add_inputSubmittingDisabled_to_documents_and_revisions {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collection) {
    await collection.updateMany({ roomId: { $ne: null } }, { $set: { 'roomContext.inputSubmittingDisabled': false } });
  }

  async collectionDown(collection) {
    await collection.updateMany({ roomId: { $ne: null } }, { $unset: { 'roomContext.inputSubmittingDisabled': null } });
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
