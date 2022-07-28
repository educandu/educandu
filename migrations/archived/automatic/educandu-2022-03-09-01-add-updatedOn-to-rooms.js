/* eslint-disable camelcase */
export default class Educandu_2022_03_09_01_add_updatedOn_to_rooms {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').update({}, [{ $set: { updatedOn: '$createdOn' } }], { multi: true });
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { updatedOn: null } });
  }
}
