class OrderStoreBase {
  constructor(collection, orderKey) {
    this.collection = collection;
    this.orderKey = orderKey;
  }

  async getNextOrder() {
    const query = { _id: this.orderKey };
    const update = { $inc: { seq: 1 } };
    const options = { upsert: true, returnDocument: 'after' };
    const result = await this.collection.findOneAndUpdate(query, update, options);
    return result.value.seq;
  }

  async getNextOrders(count) {
    const orders = [];

    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      orders.push(await this.getNextOrder());
    }

    return orders;
  }
}

export default OrderStoreBase;
