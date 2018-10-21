class StoreBase {
  constructor(collection) {
    this.collection = collection;
  }

  find({ query = {}, sort = null, projection = null, limit = 0 } = {}) {
    return this.collection.find(query, { sort, limit, projection }).toArray();
  }

  findOne({ query = {}, sort = null, projection = null, limit = 0 }) {
    return this.collection.findOne(query, { sort, limit, projection });
  }

  save(item) {
    const query = { _id: item._id };
    const options = { upsert: true };
    return this.collection.replaceOne(query, item, options);
  }

  deleteOne(query = {}) {
    return this.collection.deleteOne(query);
  }

  deleteMany(query = {}) {
    return this.collection.deleteMany(query);
  }
}

module.exports = StoreBase;
