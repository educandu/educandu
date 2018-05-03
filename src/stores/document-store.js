const Database = require('./database');

class DocumentStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.documents = db.documents;
  }

  getLastUpdatedDocuments() {
    const query = {};
    const options = { sort: [['updatedOn', -1]], limit: 10 };
    return this.documents.find(query, options).toArray();
  }

  getDocumentById(id) {
    const query = { _id: id };
    return this.documents.findOne(query);
  }

  insert(doc) {
    return this.documents.insertOne(doc);
  }

  save(doc) {
    const query = { _id: doc._id };
    const options = { upsert: true };
    return this.documents.replaceOne(query, doc, options);
  }
}

module.exports = DocumentStore;
