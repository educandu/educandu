import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentRequestDBSchema } from '../domain/schemas/document-request-schemas.js';

class DocumentRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRequests;
  }

  getAllDocumentRequestCounters({ registeredFrom, registeredUntil, daysOfWeek } = {}) {
    const filters = [];
    let matchStage;

    if (registeredFrom) {
      filters.push({ registeredOn: { $gt: registeredFrom } });
    }

    if (registeredUntil) {
      filters.push({ registeredOn: { $lt: registeredUntil } });
    }

    if (daysOfWeek) {
      filters.push({ registeredOnDayOfWeek: { $in: daysOfWeek } });
    }

    if (filters.length) {
      matchStage = { $match: { $and: filters } };
    }

    const groupStage = {
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
    };

    const projectStage = {
      $project: {
        documentId: '$_id',
        totalCount: 1,
        readCount: 1,
        writeCount: 1,
        anonymousCount: 1,
        loggedInCount: 1
      }
    };

    const stages = [matchStage, groupStage, projectStage].filter(stage => stage);

    return this.collection.aggregate(stages).toArray();
  }

  saveDocumentRequest(documentRequest, { session } = {}) {
    validate(documentRequest, documentRequestDBSchema);
    return this.collection.insertOne(documentRequest, { session });
  }
}

export default DocumentRequestStore;
