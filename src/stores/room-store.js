import Database from './database.js';

class RoomStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.rooms;
  }

  getRoomById(roomId, { session } = {}) {
    return this.collection.findOne({ _id: roomId }, { session });
  }

  deleteRoomById(roomId, { session } = {}) {
    return this.collection.deleteOne({ _id: roomId }, { session });
  }

  getRoomByIdAndOwnerId({ roomId, ownerId }, { session } = {}) {
    return this.collection.findOne({ _id: roomId, owner: ownerId }, { session });
  }

  getRoomsByOwnerId(ownerId, { session } = {}) {
    return this.collection.find({ owner: ownerId }, { session }).toArray();
  }

  async getRoomIdsByOwnerIdAndAccess({ ownerId, access }, { session } = {}) {
    const roomsProjection = await this.collection.find({ owner: ownerId, access }, { session, projection: { _id: 1 } }).toArray();
    return roomsProjection.map(projection => projection._id);
  }

  getRoomByIdJoinedByUser({ roomId, userId }, { session } = {}) {
    return this.collection.findOne({ '_id': roomId, 'members.userId': userId }, { session });
  }

  getRoomsByIdOwnedOrJoinedByUser({ roomId, userId }, { session } = {}) {
    return this.collection.findOne({ $and: [{ _id: roomId }, { $or: [{ owner: userId }, { 'members.userId': userId }] }] }, { session });
  }

  getRoomsOwnedOrJoinedByUser(userId, { session } = {}) {
    return this.collection.find({ $or: [{ owner: userId }, { 'members.userId': userId }] }, { session }).toArray();
  }

  getRoomsCreatedByUser(userId, { session } = {}) {
    return this.collection.find({ createdBy: userId }, { session }).toArray();
  }

  getRoomsUpdatedByUser(userId, { session } = {}) {
    return this.collection.find({ updatedBy: userId }, { session }).toArray();
  }

  getRoomsJoinedByUser(userId, { session } = {}) {
    return this.collection.find({ 'members.userId': userId }, { session }).toArray();
  }

  appendRoomMember({ roomId, member }, { session } = {}) {
    return this.collection.updateOne({ _id: roomId }, { $push: { members: member } }, { session });
  }

  saveRoom(room, { session } = {}) {
    return this.collection.replaceOne({ _id: room._id }, room, { session, upsert: true });
  }
}

export default RoomStore;
