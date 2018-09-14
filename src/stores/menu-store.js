const Database = require('./database');
const StoreBase = require('./store-base');

class MenuStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.menus);
  }
}

module.exports = MenuStore;
