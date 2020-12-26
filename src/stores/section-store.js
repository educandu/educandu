import Database from './database';
import StoreBase from './store-base';

class SectionStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.sections);
  }
}

export default SectionStore;
