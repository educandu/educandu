export default class Educandu_2022_12_22_04_add_lastLoggedInOn_to_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany(
      { $and: [{ accountLockedOn: null, accountClosedOn: null }] },
      { $set: { lastLoggedInOn: new Date() } }
    );
    await this.db.collection('users').updateMany(
      { accountLockedOn: { $ne: null } },
      [{ $set: { lastLoggedInOn: '$accountLockedOn' } }]
    );
    await this.db.collection('users').updateMany(
      { accountClosedOn: { $ne: null } },
      [{ $set: { lastLoggedInOn: '$accountClosedOn' } }]
    );
  }

  async down() {
    await this.db.collection('users').updateMany({}, { $set: { lastLoggedInOn: null } });
  }
}
