export default class Educandu_2022_12_22_03_change_lockedOut_to_accountLockedOn_in_users {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('users').updateMany({ lockedOut: true }, { $set: { accountLockedOn: new Date() } });
    await this.db.collection('users').updateMany({ lockedOut: false }, { $set: { accountLockedOn: null } });
    await this.db.collection('users').updateMany({}, { $unset: { lockedOut: null } });
  }

  async down() {
    await this.db.collection('users').updateMany({ accountLockedOn: { $ne: null } }, { $set: { lockedOut: true } });
    await this.db.collection('users').updateMany({ accountLockedOn: { $eq: null } }, { $set: { lockedOut: false } });
    await this.db.collection('users').updateMany({}, { $unset: { accountLockedOn: null } });
  }
}
