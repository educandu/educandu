const Database = require('../stores/database');
const OrderStoreBase = require('../stores/order-store-base');

const DOCUMENT_ORDER_KEY = 'document-order';

class DocumentOrderStore extends OrderStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.documentOrders, DOCUMENT_ORDER_KEY);
  }

  getNextDocumentOrder() {
    return this._getNextOrder();
  }
}

module.exports = DocumentOrderStore;
