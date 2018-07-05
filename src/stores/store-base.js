class StoreBase {
  constructor(collection) {
    this.collection = collection;
  }

  find({ query = {}, sort = null, limit = 0 }) {
    return this.collection.find(query, { sort, limit }).toArray();
  }

  findOne({ query = {}, sort = null, limit = 0 }) {
    return this.collection.findOne(query, { sort, limit });
  }

  save(doc) {
    const query = { _id: doc._id };
    const options = { upsert: true };
    return this.collection.replaceOne(query, doc, options);
  }

  deleteOne(query = {}) {
    return this.collection.deleteOne(query);
  }

  deleteMany(query = {}) {
    return this.collection.deleteMany(query);
  }
}

module.exports = StoreBase;
