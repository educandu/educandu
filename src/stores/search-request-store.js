import Database from './database.js';
import { validate } from '../domain/validation.js';
import { searchRequestDBSchema } from '../domain/schemas/search-request-schemas.js';

const searchRequestsProjection = {
  expiresOn: 0
};

class SearchRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.searchRequests;
  }

  getAllSearchRequests({ session } = {}) {
    return this.collection.find({}, { projection: searchRequestsProjection, session }).toArray();
  }

  saveSearchRequest(searchRequest, { session } = {}) {
    validate(searchRequest, searchRequestDBSchema);
    return this.collection.insertOne(searchRequest, { session });
  }
}

export default SearchRequestStore;
