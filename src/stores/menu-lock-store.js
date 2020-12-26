import Database from '../stores/database';
import LockStoreBase from './lock-store-base';

class MenuLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.menuLocks);
  }
}

export default MenuLockStore;
