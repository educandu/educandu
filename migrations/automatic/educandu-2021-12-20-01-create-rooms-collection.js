// eslint-disable-next-line camelcase
export default class Educandu_2021_12_20_01_create_rooms_collection {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.createCollection('rooms');
    await this.db.createCollection('roomInvitations');

    await this.db.collection('rooms').createIndexes([
      {
        name: '_idx_owner_',
        key: { owner: 1 }
      },
      {
        name: '_idx_members_user_id',
        key: { 'members.userId': 1 }
      }
    ]);

    await this.db.collection('roomInvitations').createIndexes([
      {
        name: '_idx_expires_',
        key: { expires: 1 },
        expireAfterSeconds: 0
      },
      {
        name: '_idx_roomId_email_',
        key: { email: 1, roomId: 1 },
        unique: true
      }
    ]);
  }

  async down() {
    await this.db.dropCollection('roomInvitations');
    await this.db.dropCollection('rooms');
  }
}
