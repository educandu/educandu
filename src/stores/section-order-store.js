const Database = require('../stores/database');
const OrderStoreBase = require('../stores/order-store-base');

const SECTION_ORDER_KEY = 'section-order';

class SectionOrderStore extends OrderStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.sectionOrders, SECTION_ORDER_KEY);
  }
}

module.exports = SectionOrderStore;
