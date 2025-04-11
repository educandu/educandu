import Database from './database.js';
import { validate } from '../domain/validation.js';
import { combineQueryConditions } from '../utils/query-utils.js';
import { searchRequestDBSchema } from '../domain/schemas/search-request-schemas.js';

const searchRequestsProjection = {
  _id: -1,
  expiresOn: -1
};

class SearchRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.searchRequests;
  }

  getSearchRequests({ registeredFrom, registeredUntil } = {}) {
    const conditions = [];

    if (registeredFrom) {
      conditions.push({ registeredOn: { $gte: registeredFrom } });
    }

    if (registeredUntil) {
      conditions.push({ registeredOn: { $lt: registeredUntil } });
    }

    const filter = combineQueryConditions('$and', conditions, true) || {};
    return this.collection.find(filter, { projection: searchRequestsProjection }).toArray();
  }

  saveSearchRequest(searchRequest, { session } = {}) {
    validate(searchRequest, searchRequestDBSchema);
    return this.collection.insertOne(searchRequest, { session });
  }
}

export default SearchRequestStore;
