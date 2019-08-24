class StoreBase {
  constructor(collection) {
    this.collection = collection;
  }

  async *aggregate({ pipeline }) {
    const cursor = this.collection.aggregate(pipeline);
    /* eslint-disable-next-line no-await-in-loop */
    while (await cursor.hasNext()) {
      /* eslint-disable-next-line no-await-in-loop */
      yield await cursor.next();
    }
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

  updateOne(query = {}, update = {}) {
    return this.collection.updateOne(query, update);
  }

  updateMany(query = {}, update = {}) {
    return this.collection.updateMany(query, update);
  }

  deleteOne(query = {}) {
    return this.collection.deleteOne(query);
  }

  deleteMany(query = {}) {
    return this.collection.deleteMany(query);
  }
}

module.exports = StoreBase;
