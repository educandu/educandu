class OrderStoreBase {
  constructor(collection, orderKey) {
    this.collection = collection;
    this.orderKey = orderKey;
  }

  async _getNextOrder() {
    const query = { _id: this.orderKey };
    const update = { $inc: { seq: 1 } };
    const options = { upsert: true, returnOriginal: false };
    const result = await this.collection.findOneAndUpdate(query, update, options);
    return result.value.seq;
  }
}

module.exports = OrderStoreBase;
