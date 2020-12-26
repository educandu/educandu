import Database from './database';
import StoreBase from './store-base';

class MenuStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.menus);
  }
}

export default MenuStore;
