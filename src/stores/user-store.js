const Database = require('./database');
const StoreBase = require('./store-base');

class UserStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.users);
  }
}

module.exports = UserStore;
