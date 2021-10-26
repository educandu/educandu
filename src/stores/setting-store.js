import Database from './database.js';
import StoreBase from './store-base.js';

class SettingStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.settings);
  }
}

export default SettingStore;
