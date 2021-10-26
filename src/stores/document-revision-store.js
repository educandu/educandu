import Database from './database.js';
import StoreBase from './store-base.js';

class DocumentRevisionStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentRevisions);
  }
}

export default DocumentRevisionStore;
