import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';

class DocumentRevisionStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.documentRevisions;
  }

  getDocumentRevisionById(documentRevisionId, { session } = {}) {
    return this.collection.findOne({ _id: documentRevisionId }, { session });
  }

  getAllDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { sort: [['order', 1]], session }).toArray();
  }

  saveDocumentRevision(documentRevision, { session } = {}) {
    validate(documentRevision, documentRevisionDBSchema);
    return this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true });
  }

  saveDocumentRevisions(documentRevisions, { session } = {}) {
    documentRevisions.forEach(documentRevision => validate(documentRevision, documentRevisionDBSchema));
    return Promise.all(documentRevisions
      .map(documentRevision => this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true })));
  }

  deleteDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteMany({ documentId }, { session });
  }
}

export default DocumentRevisionStore;
