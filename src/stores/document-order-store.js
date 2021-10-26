import Database from '../stores/database.js';
import OrderStoreBase from '../stores/order-store-base.js';

const DOCUMENT_ORDER_KEY = 'document-order';

class DocumentOrderStore extends OrderStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentOrders, DOCUMENT_ORDER_KEY);
  }
}

export default DocumentOrderStore;
