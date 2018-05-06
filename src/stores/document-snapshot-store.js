const Database = require('./database');

class DocumentSnapshotStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.documentSnapshots = db.documentSnapshots;
  }

  getFirst(documentId) {
    const query = { documentId };
    const options = { sort: [['order', 1]] };
    return this.documentSnapshots.findOne(query, options);
  }

  save(documentSnapshot) {
    return this.documentSnapshots.insertOne(documentSnapshot);
  }
}

module.exports = DocumentSnapshotStore;
