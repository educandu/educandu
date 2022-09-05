import Database from './database.js';
import { validate } from '../domain/validation.js';
import { roomInvitationDBSchema } from '../domain/schemas/room-schemas.js';

const roomInvitationMetadataProjection = {
  _id: 1,
  email: 1,
  sentOn: 1,
  expires: 1
};

class RoomInvitationStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.roomInvitations;
  }

  getRoomInvitationById(roomInvitationId, { session } = {}) {
    return this.collection.findOne({ _id: roomInvitationId }, { session });
  }

  getRoomInvitationByToken(token, { session } = {}) {
    return this.collection.findOne({ token }, { session });
  }

  getRoomInvitationByRoomIdAndEmail({ roomId, email }, { session } = {}) {
    return this.collection.findOne({ roomId, email }, { session });
  }

  getRoomInvitationsByEmail(email, { session } = {}) {
    return this.collection.find({ email }, { session }).toArray();
  }

  getRoomInvitationMetadataByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { session, projection: roomInvitationMetadataProjection }).toArray();
  }

  saveRoomInvitation(roomInvitation, { session } = {}) {
    validate(roomInvitation, roomInvitationDBSchema);
    return this.collection.replaceOne({ _id: roomInvitation._id }, roomInvitation, { session, upsert: true });
  }

  deleteRoomInvitationById(roomInvitationId, { session } = {}) {
    return this.collection.deleteOne({ _id: roomInvitationId }, { session });
  }

  deleteRoomInvitationsByRoomId(roomId, { session } = {}) {
    return this.collection.deleteMany({ roomId }, { session });
  }
}

export default RoomInvitationStore;
