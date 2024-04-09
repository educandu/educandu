import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentRequestDBSchema } from '../domain/schemas/document-request-schemas.js';

class DocumentRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRequests;
  }

  getAllDocumentRequestCounters() {
    return this.collection.aggregate([
      {
        $group: {
          _id: '$documentId',
          totalCount: { $sum: 1 },
          readCount: {
            $sum: {
              $cond: [{ $eq: ['$isWriteRequest', false] }, 1, 0 ]
            }
          },
          writeCount: {
            $sum: {
              $cond: [{ $eq: ['$isWriteRequest', true] }, 1, 0 ]
            }
          },
          anonymousCount: {
            $sum: {
              $cond: [{ $eq: ['$isLoggedInRequest', false] }, 1, 0 ]
            }
          },
          loggedInCount: {
            $sum: {
              $cond: [{ $eq: ['$isLoggedInRequest', true] }, 1, 0 ]
            }
          },
        }
      },
      {
        $project: {
          documentId: '$_id',
          totalCount: 1,
          readCount: 1,
          writeCount: 1,
          anonymousCount: 1,
          loggedInCount: 1
        }
      }
    ]).toArray();
  }

  saveDocumentRequest(documentRequest, { session } = {}) {
    validate(documentRequest, documentRequestDBSchema);
    return this.collection.insertOne(documentRequest, { session });
  }
}

export default DocumentRequestStore;
