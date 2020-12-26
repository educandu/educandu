import Database from './database';
import StoreBase from './store-base';

class DocumentStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documents);
  }
}

export default DocumentStore;
