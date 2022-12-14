export default class Educandu_2021_11_29_01_migrate_email_provider_index {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').dropIndex('_idx_email_provider_');

    await this.db.collection('users').createIndex(
      { email: 1, provider: 1 },
      { name: '_idx_email_provider_', unique: true, partialFilterExpression: { email: { $type: 'string' } } }
    );
  }

  async down() {
    await this.db.collection('users').dropIndex('_idx_email_provider_');

    await this.db.collection('users').createIndex(
      { email: 1, provider: 1 },
      { name: '_idx_email_provider_', unique: true }
    );
  }
}
