import Database from './database.js';
import StoreBase from './store-base.js';

const LOCK_EXPIRATION_TIME_SPAN = { minutes: 30 };

class BatchStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.batches, LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default BatchStore;
