import Database from './database.js';
import StoreBase from './store-base.js';

class RoomsStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.rooms);
  }
}

export default RoomsStore;
