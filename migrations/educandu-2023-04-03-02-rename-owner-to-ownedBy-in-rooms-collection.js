export default class Educandu_2023_04_03_02_rename_owner_to_ownedBy_in_rooms_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').dropIndex('_idx_owner_');
    await this.db.collection('rooms').updateMany({}, { $rename: { owner: 'ownedBy' } });
    await this.db.collection('rooms').createIndexes([
      {
        name: '_idx_ownedBy_',
        key: { ownedBy: 1 }
      }
    ]);
  }

  async down() {
    await this.db.collection('rooms').dropIndex('_idx_ownedBy_');
    await this.db.collection('rooms').updateMany({}, { $rename: { ownedBy: 'owner' } });
    await this.db.collection('rooms').createIndexes([
      {
        name: '_idx_owner_',
        key: { owner: 1 }
      }
    ]);
  }
}
