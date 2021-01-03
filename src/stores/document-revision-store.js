import Database from './database';
import StoreBase from './store-base';

class DocumentRevisionStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentRevisions);
  }
}

export default DocumentRevisionStore;
