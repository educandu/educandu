import Database from '../stores/database';
import OrderStoreBase from '../stores/order-store-base';

const DOCUMENT_ORDER_KEY = 'document-order';

class DocumentOrderStore extends OrderStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentOrders, DOCUMENT_ORDER_KEY);
  }
}

export default DocumentOrderStore;
