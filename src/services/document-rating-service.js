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

  async getDocumentRatingsByDocumentIds(documentIds) {
    const existingRatings = await this.documentRatingStore.getAllDocumentRatings();
    const existingRatingsByDocumentId = new Map(existingRatings.map(rating => [rating.documentId, rating]));
    return documentIds.map(documentId => existingRatingsByDocumentId.get(documentId) || this._createNonPersistedDocumentRating(documentId));
  }

  async getDocumentRatingByDocumentId(documentId) {
    const existingRating = await this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
    return existingRating || this._createNonPersistedDocumentRating(documentId);
  }

  async saveUserDocumentRating({ documentId, user, rating }) {
    const document = await this.documentStore.getDocumentById(documentId);
    if (!document) {
      throw new NotFound(`Document '${documentId}' not found.`);
    }

    if (!document.publicContext) {
      throw new BadRequest('Document ratings for non-public documents are not supported.');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequest('Rating must be an integer between 1 and 5.');
    }

    await this.documentRatingStore.createOrUpdateUserDocumentRating({
      documentId,
      userId: user._id,
      rating,
      ratedOn: new Date()
    });

    return this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
  }

  async deleteUserDocumentRating({ documentId, user }) {
    const document = await this.documentStore.getDocumentById(documentId);
    if (!document) {
      throw new NotFound(`Document '${documentId}' not found.`);
    }

    if (!document.publicContext) {
      throw new BadRequest('Document ratings for non-public documents are not supported.');
    }

    await this.documentRatingStore.deleteUserDocumentRating({
      documentId,
      userId: user._id
    });

    return this.documentRatingStore.getDocumentRatingByDocumentId(documentId);
  }

  _createNonPersistedDocumentRating(documentId) {
    return {
      _id: null,
      documentId,
      userRatingsCount: 0,
      userRatingsCountByStars: [0, 0, 0, 0, 0],
      averageRating: null
    };
  }
}

export default DocumentRatingService;
