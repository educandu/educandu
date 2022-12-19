export default class Educandu_2022_01_07_01_create_maintenance_locks_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const existingCollections = await this.db.listCollections().toArray();

    if (!existingCollections.find(x => x.name === 'maintenanceLocks')) {
      await this.db.createCollection('maintenanceLocks');
    }

    await this.db.collection('maintenanceLocks').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('maintenanceLocks');
  }
}
