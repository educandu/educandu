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

  getDocumentInputsCreatedByUser(userId, { session } = {}) {
    return this.collection.find({ createdBy: userId }, { session }).toArray();
  }

  saveDocumentInput(documentInput, { session } = {}) {
    validate(documentInput, documentInputDbSchema);
    return this.collection.replaceOne({ _id: documentInput._id }, documentInput, { session, upsert: true });
  }

  deleteDocumentInputById(documentInputId, { session } = {}) {
    return this.collection.deleteOne({ _id: documentInputId }, { session });
  }
}

export default DocumentInputStore;