export default class Educandu_2022_02_07_01_delete_orphaned_lessons {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const rooms = await this.db.collection('rooms').aggregate([{ $project: { _id: 1 } }]).toArray();
    const roomIds = rooms.map(room => room._id);

    const { deletedCount } = await this.db.collection('lessons').deleteMany({ roomId: { $nin: roomIds } });

    console.log(`Deleted ${deletedCount} orphaned lesson(s)`);
  }

  async down() { }
}
