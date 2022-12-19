export default class Educandu_2021_12_21_01_add_token_index_to_room_invitations {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('roomInvitations').createIndexes([
      {
        name: '_idx_token_',
        key: { token: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.collection('roomInvitations').dropIndex('_idx_token_');
  }
}
