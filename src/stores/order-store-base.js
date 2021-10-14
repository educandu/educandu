import StoreBase from './store-base';

class OrderStoreBase extends StoreBase {
  constructor(collection, orderKey) {
    super(collection);
    this.orderKey = orderKey;
  }

  async getNextOrder() {
    const query = { _id: this.orderKey };
    const update = { $inc: { seq: 1 } };
    const options = { upsert: true, returnDocument: 'after' };
    const result = await this.collection.findOneAndUpdate(query, update, options);
    return result.value.seq;
  }
}

export default OrderStoreBase;
