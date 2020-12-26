import Database from './database';
import StoreBase from './store-base';

class DocumentSnapshotStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentSnapshots);
  }
}

export default DocumentSnapshotStore;
