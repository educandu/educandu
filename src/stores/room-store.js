import Database from './database.js';
import { validate } from '../domain/validation.js';
import {
  roomDBSchema,
  roomMemberDBSchema,
  roomMembersDBSchema,
  roomContentDBSchema,
  roomMetadataDBSchema,
  roomMessagesDBSchema,
  roomDocumentsDBSchema
} from '../domain/schemas/room-schemas.js';

class RoomStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.rooms;
  }

  getRoomById(roomId, { session } = {}) {
    return this.collection.findOne({ _id: roomId }, { session });
  }

  getRoomsByIds(roomIds, { session } = {}) {
    return this.collection.find({ _id: { $in: roomIds } }, { session }).toArray();
  }

  deleteRoomById(roomId, { session } = {}) {
    return this.collection.deleteOne({ _id: roomId }, { session });
  }

  deleteRoomsMemberById(userId, { session } = {}) {
    return this.collection.updateMany({}, { $pull: { members: { userId } } }, { session });
  }

  getRoomByIdAndOwnerUserId({ roomId, ownerUserId }, { session } = {}) {
    return this.collection.findOne({ _id: roomId, ownedBy: ownerUserId }, { session });
  }

  getRoomsByOwnerUserId(ownerUserId, { session } = {}) {
    return this.collection.find({ ownedBy: ownerUserId }, { session }).toArray();
  }

  getRoomByIdJoinedByUser({ roomId, userId }, { session } = {}) {
    return this.collection.findOne({ '_id': roomId, 'members.userId': userId }, { session });
  }

  getRoomsByOwnerOrCollaboratorUser({ userId }, { session } = {}) {
    return this.collection.find({
      $or: [
        { ownedBy: userId },
        {
          $and: [
            { isCollaborative: true },
            { 'members.userId': userId }
          ]
        }
      ]
    }, { session })
      .toArray();
  }

  getRoomsOwnedOrJoinedByUser(userId, { session } = {}) {
    return this.collection.find({ $or: [{ ownedBy: userId }, { 'members.userId': userId }] }, { session }).toArray();
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
    validate(member, roomMemberDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $push: { members: member } }, { session });
  }

  updateRoomMetadata(roomId, metadata, { session } = {}) {
    validate(metadata, roomMetadataDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $set: { ...metadata } }, { session });
  }

  updateRoomContent(roomId, content, { session } = {}) {
    validate(content, roomContentDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $set: { ...content } }, { session });
  }

  updateRoomDocuments(roomId, documentIds, { session } = {}) {
    validate(documentIds, roomDocumentsDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $set: { documents: documentIds } }, { session });
  }

  updateRoomMembers(roomId, members, { session } = {}) {
    validate({ members }, roomMembersDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $set: { members } }, { session });
  }

  updateRoomMessages(roomId, messages, { session } = {}) {
    validate({ messages }, roomMessagesDBSchema);
    return this.collection.updateOne({ _id: roomId }, { $set: { messages } }, { session });
  }

  saveRoom(room, { session } = {}) {
    validate(room, roomDBSchema);
    return this.collection.replaceOne({ _id: room._id }, room, { session, upsert: true });
  }
}

export default RoomStore;
