import Database from '../stores/database';
import LockStoreBase from './lock-store-base';

class DocumentLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentLocks);
  }
}

export default DocumentLockStore;
