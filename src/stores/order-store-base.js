class OrderStoreBase {
  constructor(collection, orderKey) {
    this.collection = collection;
    this.orderKey = orderKey;
  }

  async getNextOrder() {
    const query = { _id: this.orderKey };
    const update = { $inc: { seq: 1 } };
    const options = { upsert: true, returnDocument: 'after' };
    const value = await this.collection.findOneAndUpdate(query, update, options);
    return value.seq;
  }

  async getNextOrders(count) {
    const orders = [];

    for (let i = 0; i < count; i += 1) {
      orders.push(await this.getNextOrder());
    }

    return orders;
  }
}

export default OrderStoreBase;
