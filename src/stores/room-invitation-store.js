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

  getRoomInvitationMetadataByRoomId({ roomId }, { session } = {}) {
    return this.find({ roomId }, { projection: roomInvitationMetadataProjection, session });
  }
}

export default RoomInvitationStore;
