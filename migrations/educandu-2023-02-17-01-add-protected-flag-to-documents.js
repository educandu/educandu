export default class Educandu_2023_02_17_01_add_protected_flag_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collection) {
    await collection.updateMany({ 'publicContext.allowedOpenContribution': 'metadataAndContent' }, { $set: { 'publicContext.protected': false } });
    await collection.updateMany({ 'publicContext.allowedOpenContribution': { $in: ['content', 'none'] } }, { $set: { 'publicContext.protected': true } });
    await collection.updateMany({}, { $unset: { 'publicContext.allowedOpenContribution': null } });
  }

  async collectionDown(collection) {
    await collection.updateMany({ 'publicContext.protected': true }, { $set: { 'publicContext.allowedOpenContribution': 'none' } });
    await collection.updateMany({ 'publicContext.protected': false }, { $set: { 'publicContext.allowedOpenContribution': 'metadataAndContent' } });
    await collection.updateMany({}, { $unset: { 'publicContext.protected': null } });
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
