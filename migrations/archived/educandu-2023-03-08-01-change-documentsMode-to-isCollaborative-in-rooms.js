export default class Educandu_2023_03_08_01_change_documentsMode_to_isCollaborative_in_rooms {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await this.db.collection('rooms').updateMany({ documentsMode: 'exclusive' }, { $set: { documentsMode: false } });
    await this.db.collection('rooms').updateMany({ documentsMode: 'collaborative' }, { $set: { documentsMode: true } });
    await this.db.collection('rooms').updateMany({}, { $rename: { documentsMode: 'isCollaborative' } });
  }

  async down() {
    await this.db.collection('rooms').updateMany({ isCollaborative: false }, { $set: { isCollaborative: 'exclusive' } });
    await this.db.collection('rooms').updateMany({ isCollaborative: true }, { $set: { isCollaborative: 'collaborative' } });
    await this.db.collection('rooms').updateMany({}, { $rename: { isCollaborative: 'documentsMode' } });
  }
}
