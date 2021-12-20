import Database from './database.js';
import StoreBase from './store-base.js';

class RoomInvitationStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.roomInvitations);
  }
}

export default RoomInvitationStore;
