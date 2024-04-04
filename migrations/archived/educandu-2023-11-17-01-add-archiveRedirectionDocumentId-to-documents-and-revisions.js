export default class Educandu_2023_11_17_01_add_archiveRedirectionDocumentId_to_documents_and_revisions {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collection) {
    await collection.updateMany({ publicContext: { $ne: null } }, { $set: { 'publicContext.archiveRedirectionDocumentId': null } });
  }

  async collectionDown(collection) {
    await collection.updateMany({ publicContext: { $ne: null } }, { $unset: { 'publicContext.archiveRedirectionDocumentId': null } });
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
