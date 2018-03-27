const Database = require('../database');

const ORDER_NAMES_DOCUMENT = 'docs';

class OrderRepository {
  static get inject() { return [Database]; }

  constructor(db) {
    this.orders = db.orders;
  }

  async _getNextOrder(name) {
    const query = { _id: name };
    const update = { $inc: { seq: 1 } };
    const options = { upsert: true, returnOriginal: false };
    const result = await this.orders.findOneAndUpdate(query, update, options);
    return result.value.seq;
  }

  getNextDocumentOrder() {
    return this._getNextOrder(ORDER_NAMES_DOCUMENT);
  }
}

OrderRepository.ORDER_NAMES_DOCUMENT = ORDER_NAMES_DOCUMENT;

module.exports = OrderRepository;
