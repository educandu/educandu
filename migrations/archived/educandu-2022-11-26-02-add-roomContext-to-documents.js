export default class Educandu_2022_11_26_02_add_roomContext_to_documents {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    await this.db.collection(collectionName).updateMany(
      { roomId: null },
      { $set: { roomContext: null } }
    );
    await this.db.collection(collectionName).updateMany(
      { roomId: { $ne: null } },
      { $set: { 'roomContext.draft': false } }
    );
  }

  async collectionDown(collectionName) {
    await this.db.collection(collectionName).updateMany({ $unset: { roomContext: null } });
  }

  async up() {
    await this.collectionUp('documentRevisions');
    await this.collectionUp('documents');
  }

  async down() {
    await this.collectionDown('documentRevisions');
    await this.collectionDown('documents');
  }
}
