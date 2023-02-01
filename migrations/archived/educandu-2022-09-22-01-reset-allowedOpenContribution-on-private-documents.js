export default class Educandu_2022_09_22_01_reset_allowedOpenContribution_on_private_documents {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documentRevisions').updateMany(
      { roomId: { $ne: null } },
      { $set: { allowedOpenContribution: 'metadataAndContent' } }
    );

    await this.db.collection('documents').updateMany(
      { roomId: { $ne: null } },
      { $set: { allowedOpenContribution: 'metadataAndContent' } }
    );
  }

  down() {
    throw new Error('Not implemented');
  }
}
