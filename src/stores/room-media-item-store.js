import Database from './database.js';
import { validate } from '../domain/validation.js';
import { roomMediaItemDbSchema } from '../domain/schemas/room-media-item-schemas.js';

class RoomMediaItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.roomMediaItems;
  }

  getRoomMediaItemById(roomMediaItemId, { session } = {}) {
    return this.collection.findOne({ _id: roomMediaItemId }, { session });
  }

  getAllRoomMediaItemsByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { session }).toArray();
  }

  async insertRoomMediaItem(roomMediaItem, { session } = {}) {
    validate(roomMediaItem, roomMediaItemDbSchema);
    await this.collection.insertOne(roomMediaItem, { session });
    return roomMediaItem;
  }

  async deleteRoomMediaItem(roomMediaItemId, { session } = {}) {
    const result = await this.collection.deleteOne({ _id: roomMediaItemId }, { session });
    return result.value;
  }

  async deleteRoomMediaItemsByRoomId(roomId, { session } = {}) {
    const result = await this.collection.deleteMany({ roomId }, { session });
    return result.value;
  }
}

export default RoomMediaItemStore;
