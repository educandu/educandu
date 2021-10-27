import Database from './database.js';
import StoreBase from './store-base.js';

class UserStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.users);
  }
}

export default UserStore;
