const Database = require('./database');
const StoreBase = require('./store-base');

class DocumentStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documents);
  }
}

module.exports = DocumentStore;
