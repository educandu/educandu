class StoreBase {
  constructor(collection) {
    this.collection = collection;
  }

  async *aggregate(...args) {
    const cursor = this.collection.aggregate(...args);
    /* eslint-disable-next-line no-await-in-loop */
    while (await cursor.hasNext()) {
      /* eslint-disable-next-line no-await-in-loop */
      yield await cursor.next();
    }
  }

  toAggregateArray(...args) {
    return this.collection.aggregate(...args).toArray();
  }

  async findRandomOne(filter) {
    const results = await this.collection.aggregate([
      { $match: filter },
      { $sample: { size: 1 } }
    ]).toArray();

    return results[0];
  }

  find(...args) {
    return this.collection.find(...args).toArray();
  }

  findOne(...args) {
    return this.collection.findOne(...args);
  }

  save(item, options = {}) {
    const query = { _id: item._id };
    return this.collection.replaceOne(query, item, Object.assign(options, { upsert: true }));
  }

  saveMany(items) {
    return Promise.all(items.map(item => this.save(item)));
  }

  insertOne(...args) {
    return this.collection.insertOne(...args);
  }

  insertMany(...args) {
    return this.collection.insertMany(...args);
  }

  updateOne(...args) {
    return this.collection.updateOne(...args);
  }

  updateMany(...args) {
    return this.collection.updateMany(...args);
  }

  deleteOne(...args) {
    return this.collection.deleteOne(...args);
  }

  deleteMany(...args) {
    return this.collection.deleteMany(...args);
  }

  distinct(...args) {
    return this.collection.distinct(...args);
  }
}

export default StoreBase;
