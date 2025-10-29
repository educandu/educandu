import Database from './database.js';
import { validate } from '../domain/validation.js';
import { dateToNumericDay } from '../utils/date-utils.js';
import { combineQueryConditions } from '../utils/query-utils.js';
import { dailyDocumentRequestDbInsertSchema } from '../domain/schemas/daily-document-request-schemas.js';

class DailyDocumentRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.dailyDocumentRequests;
  }

  getAllDocumentRequestCountersCursor({ registeredFrom, registeredUntil, daysOfWeek } = {}) {
    const filters = [];
    let matchStage;

    if (registeredFrom) {
      filters.push({ day: { $gt: dateToNumericDay(registeredFrom) } });
    }

    if (registeredUntil) {
      filters.push({ day: { $lt: dateToNumericDay(registeredUntil) } });
    }

    if (daysOfWeek) {
      filters.push({ dayOfWeek: { $in: daysOfWeek } });
    }

    if (filters.length) {
      matchStage = { $match: combineQueryConditions('$and', filters, false) };
    }

    const groupStage = {
      $group: {
        _id: '$documentId',
        totalCount: { $sum: '$totalCount' },
        readCount: { $sum: '$readCount' },
        writeCount: { $sum: '$writeCount' },
        anonymousCount: { $sum: '$anonymousCount' },
        loggedInCount: { $sum: '$loggedInCount' }
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

    return this.collection.aggregate(stages);
  }

  async incrementDailyDocumentRequestCounters({ documentId, day, dayOfWeek, expiresOn, increments }) {
    const defaultValuesOnInsert = {
      documentId,
      day,
      dayOfWeek,
      expiresOn
    };

    validate({ ...defaultValuesOnInsert, ...increments }, dailyDocumentRequestDbInsertSchema);

    await this.collection.updateOne(
      {
        documentId,
        day,
        dayOfWeek
      },
      {
        $inc: increments,
        $setOnInsert: defaultValuesOnInsert
      },
      {
        upsert: true
      }
    );
  }
}

export default DailyDocumentRequestStore;
