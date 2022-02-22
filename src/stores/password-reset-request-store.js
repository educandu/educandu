import Database from './database.js';
import StoreBase from './store-base.js';

class PasswordResetRequestStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.passwordResetRequests);
  }

  getPasswordResetRequestById(id) {
    return this.findOne({ _id: id });
  }

  deletePasswordResetRequestById(id) {
    return this.deleteOne({ _id: id });
  }
}

export default PasswordResetRequestStore;
