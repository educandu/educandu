export default class Educandu_2022_12_22_05_create_externalAccounts_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('externalAccounts');
    await this.db.collection('externalAccounts').createIndexes([
      {
        name: '_idx_expiresOn_',
        key: { expiresOn: 1 },
        expireAfterSeconds: 0
      },
      {
        name: '_idx_providerKey_externalUserId_',
        key: { providerKey: 1, externalUserId: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('externalAccounts');
  }
}
