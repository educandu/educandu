export default class Educandu_2022_02_22_02_consolidate_locks {
  constructor(db) {
    this.db = db;
  }

  async createCollectionWithIndexes(collectionName, indexes) {
    const existingCollections = await this.db.listCollections().toArray();
    if (!existingCollections.find(collection => collection.name === collectionName)) {
      await this.db.createCollection(collectionName);
    }
    if (indexes?.length) {
      await this.db.collection(collectionName).createIndexes(indexes);
    }
  }

  async up() {
    await this.createCollectionWithIndexes('locks', [
      {
        name: '_idx_type_key_',
        key: { type: 1, key: 1 },
        unique: true
      },
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);

    await this.db.dropCollection('batchLocks');
    await this.db.dropCollection('documentLocks');
    await this.db.dropCollection('maintenanceLocks');
    await this.db.dropCollection('roomLocks');
    await this.db.dropCollection('taskLocks');
  }

  async down() {
    await this.db.dropCollection('locks');

    await this.createCollectionWithIndexes('batchLocks', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.createCollectionWithIndexes('documentLocks', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.createCollectionWithIndexes('maintenanceLocks', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.createCollectionWithIndexes('roomLocks', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
    await this.createCollectionWithIndexes('taskLocks', [
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }
}
