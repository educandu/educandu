import Database from './database.js';
import StoreBase from './store-base.js';
import { validate } from '../domain/validation.js';
import { documentDBSchema } from '../domain/schemas/document-schemas.js';

class DocumentStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documents);
  }

  save(item, options = {}) {
    validate(item, documentDBSchema);
    return super.save(item, options);
  }

  saveMany(items) {
    items.forEach(item => validate(item, documentDBSchema));
    return super.saveMany(items);
  }

  getAllDocumentRevisionsByKey(documentKey, { session } = {}) {
    return this.find({ key: documentKey }, { sort: [['order', 1]], session });
  }
}

export default DocumentStore;
