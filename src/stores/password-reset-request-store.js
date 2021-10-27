import Database from './database.js';
import StoreBase from './store-base.js';

class PasswordResetRequestStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.passwordResetRequests);
  }
}

export default PasswordResetRequestStore;
