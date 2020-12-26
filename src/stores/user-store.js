import Database from './database';
import StoreBase from './store-base';

class UserStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.users);
  }
}

export default UserStore;
