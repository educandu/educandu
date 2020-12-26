import Database from './database';
import StoreBase from './store-base';

class PasswordResetRequestStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.passwordResetRequests);
  }
}

export default PasswordResetRequestStore;
