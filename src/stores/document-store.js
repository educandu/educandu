import Database from './database.js';
import StoreBase from './store-base.js';

class DocumentStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documents);
  }
}

export default DocumentStore;
