import Database from './database.js';
import StoreBase from './store-base.js';

const roomInvitationMetadataProjection = {
  _id: 1,
  email: 1,
  sentOn: 1,
  expires: 1
};

class RoomInvitationStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.roomInvitations);
  }

  getRoomInvitationByToken({ token }, { session } = {}) {
    return this.findOne({ token }, { session });
  }

  getRoomInvitationByRoomIdAndEmail({ roomId, email }, { session } = {}) {
    return this.findOne({ roomId, email }, { session });
  }

  getRoomInvitationMetadataByRoomId({ roomId }, { session } = {}) {
    return this.find({ roomId }, { session, projection: roomInvitationMetadataProjection });
  }

  deleteRoomInvitationById({ roomInvitationId }, { session } = {}) {
    return this.deleteOne({ _id: roomInvitationId }, { session });
  }

  deleteRoomInvitationsByRoomId({ roomId }, { session } = {}) {
    return this.deleteMany({ roomId }, { session });
  }
}

export default RoomInvitationStore;
