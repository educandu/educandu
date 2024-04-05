import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentRequestDBSchema } from '../domain/schemas/document-request-schemas.js';

class DocumentRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRequests;
  }

  saveDocumentRequest(documentRequest, { session } = {}) {
    validate(documentRequest, documentRequestDBSchema);
    return this.collection.insertOne(documentRequest, { session });
  }
}

export default DocumentRequestStore;
