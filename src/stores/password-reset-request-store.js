import Database from './database.js';

class PasswordResetRequestStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.passwordResetRequests;
  }

  getRequestById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  deleteRequestById(id, { session } = {}) {
    return this.collection.deleteOne({ _id: id }, { session });
  }

  saveRequest(request, { session } = {}) {
    return this.collection.replaceOne({ _id: request._id }, request, { session, upsert: true });
  }
}

export default PasswordResetRequestStore;
