export default class Educandu_2022_08_11_01_remove_public_rooms {
  constructor(db) {
    this.db = db;
  }

  extractDocumentsFromPublicRooms(collectionName) {
    return this.db.collection(collectionName)
      .updateMany(
        { $and: [{ access: 'public' }, { roomId: { $ne: null } }] },
        { $set: { roomId: null } }
      );
  }

  async up() {
    const roomsDeletionResult = await this.db.collection('rooms').deleteMany({ access: 'public' });
    console.log(`Deleted ${roomsDeletionResult?.deletedCount || 0} public rooms.`);

    await this.extractDocumentsFromPublicRooms('documentRevisions');
    const documentsExtractionResult = await this.extractDocumentsFromPublicRooms('documents');
    console.log(`Extracted ${documentsExtractionResult?.modifiedCount || 0} documents from public rooms.`);

    await this.db.collection('documents').dropIndex('_idx_access_');
    await this.db.collection('documents').dropIndex('_idx_access_archived_');

    await this.db.collection('rooms').updateMany({}, { $unset: { access: null } });
    await this.db.collection('documentRevisions').updateMany({}, { $unset: { access: null } });
    await this.db.collection('documents').updateMany({}, { $unset: { access: null } });
  }

  down() {
    throw new Error('Not implemented');
  }
}
