import Database from './database.js';
import { ROOM_ACCESS } from '../domain/constants.js';

const roomsMinimalMetadataProjection = {
  _id: 1,
  slug: 1,
  name: 1
};

class RoomStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.rooms;
  }

  getRoomById(roomId, { session } = {}) {
    return this.collection.findOne({ _id: roomId }, { session });
  }

  getRoomsByIds(roomIds, { session } = {}) {
    return this.collection.find({ _id: { $in: roomIds } }, { session }).toArray();
  }

  getRoomsMinimalMetadataByIds(roomIds, { session } = {}) {
    return this.collection.find({ _id: { $in: roomIds } }, { projection: roomsMinimalMetadataProjection, session }).toArray();
  }

  getAllPrivateRoomIds({ session } = {}) {
    return this.collection.distinct('_id', { access: ROOM_ACCESS.private }, { session });
  }

  deleteRoomById(roomId, { session } = {}) {
    return this.collection.deleteOne({ _id: roomId }, { session });
  }

  deleteRoomsMemberById(userId, { session } = {}) {
    return this.collection.updateMany({}, { $pull: { members: { userId: { $eq: userId } } } }, { session });
  }

  getRoomByIdAndOwnerId({ roomId, ownerId }, { session } = {}) {
    return this.collection.findOne({ _id: roomId, owner: ownerId }, { session });
  }

  getRoomsByOwnerId(ownerId, { session } = {}) {
    return this.collection.find({ owner: ownerId }, { session }).toArray();
  }

  getPublicRoomsByOwnerId(ownerId, { session } = {}) {
    return this.collection.find({ owner: ownerId, access: ROOM_ACCESS.public }, { session }).toArray();
  }

  getPrivateRoomsByOwnerId(ownerId, { session } = {}) {
    return this.collection.find({ owner: ownerId, access: ROOM_ACCESS.private }, { session }).toArray();
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

  getLatestRoomsCreatedByUser(userId, { session, limit } = {}) {
    return this.collection.find({ createdBy: userId }, { session }).sort({ createdOn: -1 }).limit(limit || 0).toArray();
  }

  getLatestRoomsUpdatedByUser(userId, { session, limit } = {}) {
    return this.collection.find({ updatedBy: userId }, { session }).sort({ updatedOn: -1 }).limit(limit || 0).toArray();
  }

  getLatestRoomsJoinedByUser(userId, { session, limit } = {}) {
    return this.collection.find({ 'members.userId': userId }, { session }).sort({ 'members.joinedOn': -1 }).limit(limit || 0).toArray();
  }

  appendRoomMember({ roomId, member }, { session } = {}) {
    return this.collection.updateOne({ _id: roomId }, { $push: { members: member } }, { session });
  }

  saveRoom(room, { session } = {}) {
    return this.collection.replaceOne({ _id: room._id }, room, { session, upsert: true });
  }
}

export default RoomStore;
