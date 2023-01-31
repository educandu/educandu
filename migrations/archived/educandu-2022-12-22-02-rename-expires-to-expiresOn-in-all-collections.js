export default class Educandu_2022_12_22_02_rename_expires_to_expiresOn_in_all_collections {
  constructor(db) {
    this.db = db;
  }

  async collectionUp(collectionName) {
    await this.db.collection(collectionName).updateMany({}, { $rename: { expires: 'expiresOn' } });
    await this.db.collection(collectionName).dropIndex('_idx_expires_');
    await this.db.collection(collectionName).createIndexes([{ name: '_idx_expiresOn_', key: { expiresOn: 1 }, expireAfterSeconds: 0 }]);
  }

  async collectionDown(collectionName) {
    await this.db.collection(collectionName).updateMany({}, { $rename: { expiresOn: 'expires' } });
    await this.db.collection(collectionName).dropIndex('_idx_expiresOn_');
    await this.db.collection(collectionName).createIndexes([{ name: '_idx_expires_', key: { expires: 1 }, expireAfterSeconds: 0 }]);
  }

  async up() {
    await this.collectionUp('users');
    await this.collectionUp('locks');
    await this.collectionUp('roomInvitations');
    await this.collectionUp('requestLimitRecords');
    await this.collectionUp('passwordResetRequests');
  }

  async down() {
    await this.collectionDown('users');
    await this.collectionDown('locks');
    await this.collectionDown('roomInvitations');
    await this.collectionDown('requestLimitRecords');
    await this.collectionDown('passwordResetRequests');
  }
}
