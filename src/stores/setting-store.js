const Database = require('./database');
const StoreBase = require('./store-base');

class SettingStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.settings);
  }
}

module.exports = SettingStore;
