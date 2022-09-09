/* eslint-disable camelcase, no-await-in-loop, no-console */
export default class Educandu_2022_09_09_01_add_documents_list_to_rooms {
  constructor(db) {
    this.db = db;
  }

  async up() {
    const rooms = await this.db.collection('rooms').find().toArray();
    for (const room of rooms) {
      const documents = await this.db.collection('documents').find({ roomId: room._id }).toArray();
      room.documents = documents.map(doc => doc._id);

      await this.db.collection('rooms').replaceOne({ _id: room._id }, room);

      console.log(`Updated room '${room._id}' with documents [${room.documents}]`);
    }
  }

  async down() {
    await this.db.collection('rooms').updateMany({}, { $unset: { documents: null } });
  }
}
