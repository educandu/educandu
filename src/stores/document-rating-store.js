import Database from './database.js';

class DocumentRatingStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRatings;
  }

  getDocumentRatingByDocumentId(documentId, { session } = {}) {
    return this.collection.findOne({ documentId }, { session });
  }

  deleteDocumentRatingByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteOne({ documentId }, { session });
  }

  // eslint-disable-next-line no-unused-vars
  createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp }, { session } = {}) {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line no-unused-vars
  deleteUserDocumentRating({ documentId, userId }, { session } = {}) {
    return Promise.resolve(null);
  }
}

export default DocumentRatingStore;
