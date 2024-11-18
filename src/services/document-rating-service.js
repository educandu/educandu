import httpErrors from 'http-errors';
import DocumentStore from '../stores/document-store.js';
import DocumentRatingStore from '../stores/document-rating-store.js';

const { BadRequest, NotFound } = httpErrors;

class DocumentRatingService {
  static dependencies = [DocumentRatingStore, DocumentStore];

  constructor(documentRatingStore, documentStore) {
    this.documentRatingStore = documentRatingStore;
    this.documentStore = documentStore;
  }

  getAllDocumentRatings() {
    return this.documentRatingStore.getAllDocumentRatings();
  }

  async getDocumentRatingsByDocumentIds(documentIds) {
    const existingRatings = await this.documentRatingStore.getDocumentRatingsByDocumentIds(documentIds);
    const existingRatingsByDocumentId = new Map(existingRatings.map(rating => [rating.documentId, rating]));
    return documentIds.map(documentId => existingRatingsByDocumentId.get(documentId) || this._createNonPersistedDocumentRating(documentId));
  }

  async getDocumentRatingByDocumentId(documentId) {
    const existingRating = await this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
    return existingRating || this._createNonPersistedDocumentRating(documentId);
  }

  getRating({ documentId, user }) {
    return this.documentRatingStore.getRating({ documentId, userId: user._id });
  }

  async saveRating({ documentId, user, value }) {
    const document = await this.documentStore.getDocumentById(documentId);
    if (!document) {
      throw new NotFound(`Document '${documentId}' not found.`);
    }

    if (!document.publicContext) {
      throw new BadRequest('Document ratings for non-public documents are not supported.');
    }

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new BadRequest('Rating must be an integer between 1 and 5.');
    }

    await this.documentRatingStore.saveRating({
      documentId,
      userId: user._id,
      value,
      ratedOn: new Date()
    });

    return this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
  }

  async deleteRating({ documentId, user }) {
    const document = await this.documentStore.getDocumentById(documentId);
    if (!document) {
      throw new NotFound(`Document '${documentId}' not found.`);
    }

    if (!document.publicContext) {
      throw new BadRequest('Document ratings for non-public documents are not supported.');
    }

    await this.documentRatingStore.deleteRating({
      documentId,
      userId: user._id
    });

    return this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
  }

  _createNonPersistedDocumentRating(documentId) {
    return {
      _id: null,
      documentId,
      ratingsCount: 0,
      ratingsCountPerValue: [0, 0, 0, 0, 0],
      averageRatingValue: null
    };
  }
}

export default DocumentRatingService;
