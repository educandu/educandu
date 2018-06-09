const Database = require('./database');
const StoreBase = require('./store-base');

class SectionStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.sections);
  }
}

module.exports = SectionStore;
