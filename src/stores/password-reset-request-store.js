const Database = require('./database');
const StoreBase = require('./store-base');

class PasswordResetRequestStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.passwordResetRequests);
  }
}

module.exports = PasswordResetRequestStore;
