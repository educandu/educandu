import Database from './database.js';
import uniqueId from '../utils/unique-id.js';

const basicProjection = {
  _id: 1,
  documentId: 1,
  userRatingsCount: 1,
  averageRating: 1
};

class DocumentRatingStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRatings;
  }

  getBasicDocumentRatingByDocumentId(documentId, { session } = {}) {
    return this.collection.findOne({ documentId }, { projection: basicProjection, session });
  }

  createOrUpdateUserDocumentRating({ documentId, userId, rating, timestamp }, { session } = {}) {
    const initialDocumentRating = {
      _id: uniqueId.create(),
      documentId,
      userRatings: [],
      userRatingsCount: 0,
      averageRating: null
    };

    const upsertedUserRatingItem = {
      userId,
      rating,
      timestamp
    };

    const updatePipeline = [
      {
        $set: {
          _id: { $ifNull: ['$_id', initialDocumentRating._id] },
          documentId: { $ifNull: ['$documentId', initialDocumentRating.documentId] },
          userRatings: { $ifNull: ['$userRatings', initialDocumentRating.userRatings] },
          averageRating: { $ifNull: ['$averageRating', initialDocumentRating.averageRating] }
        }
      },
      {
        $set: {
          userRatings: { $filter: { input: '$userRatings', cond: { $ne: [ '$$this.userId', userId ] } } }
        }
      },
      {
        $set: {
          userRatings: { $concatArrays: ['$userRatings', [upsertedUserRatingItem]] }
        }
      },
      {
        $set: {
          userRatingsCount: { $size: '$userRatings' },
          averageRating: { $avg: '$userRatings.rating' }
        }
      }
    ];

    return this.collection.updateOne({ documentId }, updatePipeline, { upsert: true, session });
  }

  deleteUserDocumentRating({ documentId, userId }, { session } = {}) {
    const updatePipeline = [
      {
        $set: {
          userRatings: { $filter: { input: '$userRatings', cond: { $ne: [ '$$this.userId', userId ] } } }
        }
      },
      {
        $set: {
          userRatingsCount: { $size: '$userRatings' },
          averageRating: { $avg: '$userRatings.rating' }
        }
      }
    ];

    return this.collection.updateOne({ documentId, 'userRatings.userId': userId }, updatePipeline, { session });
  }
}

export default DocumentRatingStore;
