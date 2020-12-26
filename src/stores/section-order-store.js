import Database from '../stores/database';
import OrderStoreBase from '../stores/order-store-base';

const SECTION_ORDER_KEY = 'section-order';

class SectionOrderStore extends OrderStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.sectionOrders, SECTION_ORDER_KEY);
  }
}

export default SectionOrderStore;
