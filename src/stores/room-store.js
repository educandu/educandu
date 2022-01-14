import Database from './database.js';
import StoreBase from './store-base.js';

const LOCK_EXPIRATION_TIME_SPAN = { minutes: 1 };

class RoomStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.rooms, LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default RoomStore;
