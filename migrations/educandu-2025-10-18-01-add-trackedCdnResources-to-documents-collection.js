export default class Educandu_2025_10_18_01_add_trackedCdnResources_to_documents_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('documents').updateMany({}, { $set: { trackedCdnResources: [] } });
    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_trackedCdnResources_',
        key: { trackedCdnResources: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('documents').dropIndex('_idx_trackedCdnResources_');
    await this.db.collection('documents').updateMany({}, { $unset: { trackedCdnResources: null } });
  }
}
