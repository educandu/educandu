import Database from './database.js';
import uniqueId from '../utils/unique-id.js';

const RATING_VALUES = [1, 2, 3, 4, 5];

const documentRatingProjection = {
  _id: 1,
  documentId: 1,
  ratingsCount: 1,
  ratingsCountPerValue: 1,
  averageRatingValue: 1
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

  getDocumentRatingsByDocumentIds(documentIds, { session } = {}) {
    return this.collection.find({ documentId: { $in: documentIds } }, { projection: documentRatingProjection, session }).toArray();
  }

  async getRating({ documentId, userId }, { session } = {}) {
    const foundRatings = await this.collection.aggregate([
      { $match : { documentId, 'ratings.userId': userId } },
      { $unwind : '$ratings' },
      { $match : { 'ratings.userId': userId } },
      { $replaceRoot: { newRoot: '$ratings' } }
    ], { session }).toArray();

    return foundRatings[0] || null;
  }

  saveRating({ documentId, userId, value, ratedOn }, { session } = {}) {
    const initialDocumentRating = {
      _id: uniqueId.create(),
      documentId,
      ratings: [],
      ratingsCount: 0,
      ratingsCountPerValue: RATING_VALUES.map(() => 0),
      averageRatingValue: null
    };

    const upsertedRating = {
      userId,
      value,
      ratedOn
    };

    const updatePipeline = [
      {
        $set: {
          _id: { $ifNull: ['$_id', initialDocumentRating._id] },
          documentId: { $ifNull: ['$documentId', initialDocumentRating.documentId] },
          ratings: { $ifNull: ['$ratings', initialDocumentRating.ratings] },
          ratingsCount: { $ifNull: ['$ratingsCount', initialDocumentRating.ratingsCount] },
          ratingsCountPerValue: { $ifNull: ['$ratingsCountPerValue', initialDocumentRating.ratingsCountPerValue] },
          averageRatingValue: { $ifNull: ['$averageRatingValue', initialDocumentRating.averageRatingValue] }
        }
      },
      {
        $set: {
          ratings: { $filter: { input: '$ratings', cond: { $ne: [ '$$this.userId', userId ] } } }
        }
      },
      {
        $set: {
          ratings: { $concatArrays: ['$ratings', [upsertedRating]] }
        }
      },
      {
        $set: {
          ratingsCount: { $size: '$ratings' },
          ratingsCountPerValue: RATING_VALUES.map(ratingValue => ({
            $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this.value', ratingValue] } } }
          })),
          averageRatingValue: { $avg: '$ratings.value' }
        }
      }
    ];

    return this.collection.updateOne({ documentId }, updatePipeline, { upsert: true, session });
  }

  deleteRating({ documentId, userId }, { session } = {}) {
    const updatePipeline = [
      {
        $set: {
          ratings: { $filter: { input: '$ratings', cond: { $ne: [ '$$this.userId', userId ] } } }
        }
      },
      {
        $set: {
          ratingsCount: { $size: '$ratings' },
          ratingsCountPerValue: RATING_VALUES.map(ratingValue => ({
            $size: { $filter: { input: '$ratings', cond: { $eq: ['$$this.value', ratingValue] } } }
          })),
          averageRatingValue: { $avg: '$ratings.value' }
        }
      }
    ];

    return this.collection.updateOne({ documentId, 'ratings.userId': userId }, updatePipeline, { session });
  }
}

export default DocumentRatingStore;
