import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentCommentDBSchema } from '../domain/schemas/document-comment-schemas.js';

class DocumentCommentStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentComments;
  }

  getDocumentCommentById(documentCommentId, { session } = {}) {
    return this.collection.findOne({ _id: documentCommentId }, { session });
  }

  getAllDocumentCommentsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { session }).toArray();
  }

  deleteDocumentCommentById(documentCommentId, { session } = {}) {
    return this.collection.deleteOne({ _id: documentCommentId }, { session });
  }

  saveDocumentComment(documentComment, { session } = {}) {
    validate(documentComment, documentCommentDBSchema);
    return this.collection.replaceOne({ _id: documentComment._id }, documentComment, { session, upsert: true });
  }

  updateDocumentCommentsTopic({ documentId, oldTopic, newTopic }, { session } = {}) {
    return this.collection.updateMany({ documentId, topic: oldTopic }, { $set: { topic: newTopic } }, { session, upsert: true });
  }

  deleteDocumentCommentsByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteMany({ documentId }, { session });
  }

  deleteDocumentCommentsByDocumentIds(documentIds, { session } = {}) {
    return this.collection.deleteMany({ documentId: { $in: documentIds } }, { session });
  }
}

export default DocumentCommentStore;
