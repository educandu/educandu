import Database from './database.js';
import uniqueId from '../utils/unique-id.js';

const DOCUMENT_RATING_VALUES = [1, 2, 3, 4, 5];

const documentRatingProjection = {
  _id: 1,
  documentId: 1,
  userRatingsCount: 1,
  userRatingsCountByStars: 1,
  averageRating: 1
};

class DocumentRatingStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRatings;
  }

  getAllDocumentRatings({ session } = {}) {
    return this.collection.find({}, { projection: documentRatingProjection, session }).toArray();
  }

  getDocumentRatingByDocumentId(documentId, { session } = {}) {
    return this.collection.findOne({ documentId }, { projection: documentRatingProjection, session });
  }

  async getUserDocumentRating({ documentId, userId }, { session } = {}) {
    const foundUserRatings = await this.collection.aggregate([
      { $match : { documentId, 'userRatings.userId': userId } },
      { $unwind : '$userRatings' },
      { $match : { 'userRatings.userId': userId } },
      { $replaceRoot: { newRoot: '$userRatings' } }
    ], { session }).toArray();

    return foundUserRatings[0] || null;
  }

  saveUserDocumentRating({ documentId, userId, rating, ratedOn }, { session } = {}) {
    const initialDocumentRating = {
      _id: uniqueId.create(),
      documentId,
      userRatings: [],
      userRatingsCount: 0,
      userRatingsCountByStars: DOCUMENT_RATING_VALUES.map(() => 0),
      averageRating: null
    };

    const upsertedUserRatingItem = {
      userId,
      rating,
      ratedOn
    };

    const updatePipeline = [
      {
        $set: {
          _id: { $ifNull: ['$_id', initialDocumentRating._id] },
          documentId: { $ifNull: ['$documentId', initialDocumentRating.documentId] },
          userRatings: { $ifNull: ['$userRatings', initialDocumentRating.userRatings] },
          userRatingsCount: { $ifNull: ['$userRatingsCount', initialDocumentRating.userRatingsCount] },
          userRatingsCountByStars: { $ifNull: ['$userRatingsCountByStars', initialDocumentRating.userRatingsCountByStars] },
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
          userRatingsCountByStars: DOCUMENT_RATING_VALUES.map(ratingValue => ({
            $size: { $filter: { input: '$userRatings', cond: { $eq: ['$$this.rating', ratingValue] } } }
          })),
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
          userRatingsCountByStars: DOCUMENT_RATING_VALUES.map(ratingValue => ({
            $size: { $filter: { input: '$userRatings', cond: { $eq: ['$$this.rating', ratingValue] } } }
          })),
          averageRating: { $avg: '$userRatings.rating' }
        }
      }
    ];

    return this.collection.updateOne({ documentId, 'userRatings.userId': userId }, updatePipeline, { session });
  }
}

export default DocumentRatingStore;
