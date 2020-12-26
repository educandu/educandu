import Database from './database';
import StoreBase from './store-base';

class SettingStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.settings);
  }
}

export default SettingStore;
