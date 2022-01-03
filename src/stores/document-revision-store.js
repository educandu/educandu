import Database from './database.js';
import StoreBase from './store-base.js';
import { validate } from '../domain/validation.js';
import { documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';

class DocumentRevisionStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentRevisions);
  }

  save(item, options = {}) {
    validate(item, documentRevisionDBSchema);
    return super.save(item, options);
  }

  saveMany(items) {
    items.forEach(item => validate(item, documentRevisionDBSchema));
    return super.saveMany(items);
  }
}

export default DocumentRevisionStore;
