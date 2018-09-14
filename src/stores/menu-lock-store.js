const Database = require('../stores/database');
const LockStoreBase = require('./lock-store-base');

class MenuLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.menuLocks);
  }
}

module.exports = MenuLockStore;
