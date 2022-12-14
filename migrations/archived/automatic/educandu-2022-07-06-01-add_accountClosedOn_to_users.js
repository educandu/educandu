export default class Educandu_2022_07_06_01_add_accountClosedOn_to_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({}, { $set: { accountClosedOn: null } });

    await this.db.collection('users').dropIndex('_idx_email');

    await this.db.collection('users').createIndexes([
      {
        name: '_idx_email_accountClosedOn_',
        key: { email: 1, accountClosedOn: 1 },
        unique: true,
        partialFilterExpression: { $and: [{ email: { $type: 'string' } }, { accountClosedOn: null }] }
      }
    ]);
  }

  async down() {
    await this.db.collection('users').dropIndex('_idx_email_accountClosedOn_');

    await this.db.collection('users').createIndexes([
      {
        name: '_idx_email',
        key: { username: 1 },
        unique: true
      }
    ]);

    await this.db.collection('users').updateMany({}, { $unset: { accountClosedOn: null } });
  }
}
