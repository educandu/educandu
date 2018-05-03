const DocumentSnapshotStore = require('../stores/document-snapshot-store');
const DocumentOrderStore = require('../stores/document-order-store');
const DocumentLockStore = require('../stores/document-lock-store');
const DocumentStore = require('../stores/document-store');
const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');

class DocumentService {
  static get inject() { return [DocumentSnapshotStore, DocumentOrderStore, DocumentLockStore, DocumentStore]; }

  constructor(documentSnapshotStore, documentOrderStore, documentLockStore, documentStore) {
    this.documentSnapshotStore = documentSnapshotStore;
    this.documentOrderStore = documentOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
  }

  /* eslint no-inline-comments: off */
  /* eslint no-warning-comments: off */
  /* eslint line-comment-position: off */

  async createDocumentRevision({ documentId, title, sections, user }) {
    const documentRevisionId = uniqueId.create();
    await this.documentLockStore.takeDocumentLock(documentId);
    const order = await this.documentOrderStore.getNextDocumentOrder();
    // TODO: update sections first!
    const newSnapshot = {
      _id: documentRevisionId,
      documentId: documentId,
      createdOn: dateTime.now(),
      order: order,
      user: user,
      title: title,
      sections: sections.map(section => ({ id: section._id, order: section.order }))
    };
    await this.documentSnapshotStore.save(newSnapshot);
    const firstSnapshot = await this.documentSnapshotStore.getFirst(documentId);
    const latest = {
      _id: documentId,
      snapshotId: newSnapshot._id,
      createdOn: firstSnapshot.createdOn,
      updatedOn: newSnapshot.createdOn,
      order: order,
      user: user,
      title: title,
      sections: sections // TODO: render!
    };
    await this.documentStore.save(latest);
    await this.documentLockStore.releaseDocumentLock(documentId);
    return latest;
  }
}

module.exports = DocumentService;
