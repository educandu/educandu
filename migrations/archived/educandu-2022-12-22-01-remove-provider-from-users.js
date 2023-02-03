export default class Educandu_2022_12_22_01_remove_provider_from_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $unset: { provider: null } });
    await this.db.collection('users').dropIndex('_idx_verificationCode_provider_');
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $set: { provider: 'educandu' } });
    await this.db.collection('users').createIndexes([
      {
        name: '_idx_verificationCode_provider_',
        key: { verificationCode: 1, provider: 1 },
        unique: true,
        partialFilterExpression: { verificationCode: { $type: 'string' } }
      }
    ]);
  }
}
