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

  find(...args) {
    return this.collection.find(...args).toArray();
  }

  findOne(...args) {
    return this.collection.findOne(...args);
  }

  save(item) {
    const query = { _id: item._id };
    const options = { upsert: true };
    return this.collection.replaceOne(query, item, options);
  }

  saveMany(items) {
    return Promise.all(items.map(item => this.save(item)));
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
}

export default StoreBase;
