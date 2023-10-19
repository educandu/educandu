import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentInputDbSchema } from '../domain/schemas/document-input-schemas.js';

class DocumentInputStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentInputs;
  }

  getDocumentInputById(documentInputId, { session } = {}) {
    return this.collection.findOne({ _id: documentInputId }, { session });
  }

  getDocumentInputsByIds(documentInputIds, { session } = {}) {
    return this.collection.find({ _id: { $in: documentInputIds } }, { session }).toArray();
  }

  getAllDocumentInputsCreatedByUser(userId, { session } = {}) {
    return this.collection.find({ createdBy: userId }, { session }).toArray();
  }

  getDocumentInputsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { session }).toArray();
  }

  getDocumentInputsByDocumentIds(documentIds, { session } = {}) {
    return this.collection.find({ documentId: { $in: documentIds } }, { session }).toArray();
  }

  saveDocumentInput(documentInput, { session } = {}) {
    validate(documentInput, documentInputDbSchema);
    return this.collection.replaceOne({ _id: documentInput._id }, documentInput, { session, upsert: true });
  }

  deleteDocumentInputById(documentInputId, { session } = {}) {
    return this.collection.deleteOne({ _id: documentInputId }, { session });
  }

  deleteDocumentInputsByIds(documentInputIds, { session } = {}) {
    return this.collection.deleteMany({ _id: { $in: documentInputIds } }, { session });
  }

  deleteDocumentInputsByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteMany({ documentId }, { session });
  }

  deleteDocumentInputsByDocumentIds(documentIds, { session } = {}) {
    return this.collection.deleteMany({ documentId: { $in: documentIds } }, { session });
  }
}

export default DocumentInputStore;
