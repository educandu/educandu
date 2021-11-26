import Database from './database.js';
import StoreBase from './store-base.js';

class BatchStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.batches);
  }
}

export default BatchStore;
