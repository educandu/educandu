export default class Educandu_2022_01_05_02_change_user_indices {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').createIndexes([
      {
        name: '_idx_email',
        key: { email: 1 },
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } }
      }
    ]);
    await this.db.collection('users').dropIndex('_idx_email_provider_');
  }

  async down() {
    await this.db.collection('users').dropIndex('_idx_email');
    await this.db.collection('users').createIndexes([
      {
        name: '_idx_email_provider_',
        key: { email: 1, provider: 1 },
        unique: true,
        partialFilterExpression: { email: { $type: 'string' } }
      }
    ]);
  }
}
