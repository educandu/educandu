import Database from './database.js';
import StoreBase from './store-base.js';

class PasswordResetRequestStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.passwordResetRequests);
  }

  getPasswordResetRequestById(id, { session } = {}) {
    return this.findOne({ _id: id }, { session });
  }

  deletePasswordResetRequestById(id, { session } = {}) {
    return this.deleteOne({ _id: id }, { session });
  }
}

export default PasswordResetRequestStore;
