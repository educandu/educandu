import Database from './database.js';
import StoreBase from './store-base.js';

class RoomStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.rooms);
  }

  getRoomById({ roomId }, { session } = {}) {
    return this.findOne({ _id: roomId }, { session });
  }

  deleteRoomById({ roomId }, { session } = {}) {
    return this.deleteOne({ _id: roomId }, { session });
  }

  getRoomByIdAndOwnerId({ roomId, ownerId }, { session } = {}) {
    return this.findOne({ _id: roomId, owner: ownerId }, { session });
  }

  getRoomsByOwnerId({ ownerId }, { session } = {}) {
    return this.find({ owner: ownerId }, { session });
  }

  getRoomByIdJoinedByUser({ roomId, userId }, { session } = {}) {
    return this.findOne({ '_id': roomId, 'members.userId': userId }, { session });
  }

  getRoomsByIdOwnedOrJoinedByUser({ roomId, userId }, { session } = {}) {
    return this.findOne({ $and: [{ _id: roomId }, { $or: [{ owner: userId }, { 'members.userId': userId }] }] }, { session });
  }

  getRoomsOwnedOrJoinedByUser({ userId }, { session } = {}) {
    return this.find({ $or: [{ owner: userId }, { 'members.userId': userId }] }, { session });
  }

  appendRoomMember({ roomId, member }, { session } = {}) {
    return this.updateOne({ _id: roomId }, { $push: { members: member } }, { session });
  }
}

export default RoomStore;
