const DocumentSnapshotStore = require('../stores/document-snapshot-store');
const DocumentOrderStore = require('../stores/document-order-store');
const SectionOrderStore = require('../stores/section-order-store');
const DocumentLockStore = require('../stores/document-lock-store');
const DocumentStore = require('../stores/document-store');
const SectionStore = require('../stores/section-store');
const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');
const deepEqual = require('fast-deep-equal');

class DocumentService {
  static get inject() { return [DocumentSnapshotStore, DocumentOrderStore, SectionOrderStore, DocumentLockStore, DocumentStore, SectionStore]; }

  constructor(documentSnapshotStore, documentOrderStore, sectionOrderStore, documentLockStore, documentStore, sectionStore) {
    this.documentSnapshotStore = documentSnapshotStore;
    this.documentOrderStore = documentOrderStore;
    this.sectionOrderStore = sectionOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
    this.sectionStore = sectionStore;
  }

  getLastUpdatedDocuments(numberOfDocs = 10) {
    return this.documentStore.find({
      sort: [['updatedOn', -1]],
      limit: numberOfDocs
    });
  }

  getDocumentsMetadata(documentIds = null) {
    const query = documentIds ? { _id: { $in: documentIds } } : {};
    return this.documentStore.find({
      query: query,
      sort: [['updatedOn', -1]],
      projection: {
        _id: 1,
        title: 1,
        slug: 1,
        createdOn: 1,
        updatedOn: 1,
        createdBy: 1,
        updatedBy: 1
      }
    });
  }

  getDocumentById(documentId) {
    return this.documentStore.findOne({
      query: { _id: documentId }
    });
  }

  getDocumentBySlug(slug) {
    return this.documentStore.findOne({
      query: { slug }
    });
  }

  getSectionById(sectionId) {
    return this.sectionStore.findOne({
      query: { _id: sectionId }
    });
  }

  getInitialDocumentSnapshot(documentKey) {
    return this.documentSnapshotStore.findOne({
      query: { key: documentKey },
      sort: [['order', 1]]
    });
  }

  getLatestDocumentSnapshot(documentKey) {
    return this.documentSnapshotStore.findOne({
      query: { key: documentKey },
      sort: [['order', -1]]
    });
  }

  async createDocumentRevision({ doc, sections, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    const now = dateTime.now();
    const documentKey = doc.key || uniqueId.create();

    await this.documentLockStore.takeLock(documentKey);

    const latestSnapshot = await this.getLatestDocumentSnapshot(documentKey);

    if (!this.userCanUpdateDoc(latestSnapshot, doc, user)) {
      throw new Error('The user does not have permission to update the document');
    }

    const updatedSections = await Promise.all(sections.map(async section => {
      // Load potentially existing revision:
      const existingSection = section.ancestorId ? await this.getSectionById(section.ancestorId) : null;

      if (existingSection && section.type && existingSection.type !== section.type) {
        throw new Error('Sections cannot change their type');
      }

      if (existingSection && section.key && existingSection.key !== section.key) {
        throw new Error('Sections cannot change their key');
      }

      if (!existingSection && !section.type) {
        throw new Error('New sections must specify a type');
      }

      if (!section.content) {
        throw new Error('Sections must specify a content');
      }

      // If not changed, re-use existing revision:
      if (existingSection && deepEqual(existingSection.content, section.content)) {
        return existingSection;
      }

      // Otherwise, create a new one:
      const newRevision = {
        _id: uniqueId.create(),
        ancestorId: section.ancestorId || null,
        key: existingSection ? existingSection.key : section.key || uniqueId.create(),
        createdOn: now,
        createdBy: { id: user._id },
        order: await this.sectionOrderStore.getNextOrder(),
        type: existingSection ? existingSection.type : section.type,
        content: section.content
      };

      await this.sectionStore.save(newRevision);
      return newRevision;
    }));

    const newSnapshot = {
      _id: uniqueId.create(),
      key: documentKey,
      createdOn: now,
      createdBy: { id: user._id },
      order: await this.documentOrderStore.getNextOrder(),
      title: doc.title || '',
      slug: doc.slug || null,
      sections: updatedSections.map(section => ({ id: section._id }))
    };

    await this.documentSnapshotStore.save(newSnapshot);

    const firstSnapshot = await this.getInitialDocumentSnapshot(documentKey);

    const latestDocument = {
      _id: documentKey,
      snapshotId: newSnapshot._id,
      createdOn: firstSnapshot.createdOn,
      updatedOn: newSnapshot.createdOn,
      createdBy: firstSnapshot.createdBy,
      updatedBy: newSnapshot.createdBy,
      order: newSnapshot.order,
      title: newSnapshot.title,
      slug: newSnapshot.slug,
      sections: updatedSections
    };

    await this.documentStore.save(latestDocument);

    await this.documentLockStore.releaseLock(documentKey);

    return latestDocument;
  }

  /* eslint-disable-next-line no-unused-vars */
  userCanUpdateDoc(previousSnapshot, newDoc, user) {
    return true;
  }

  async deleteDocument({ documentKey }) {
    await this.documentLockStore.takeLock(documentKey);
    await this.documentStore.deleteOne({ _id: documentKey });
    await this.documentSnapshotStore.deleteMany({ key: documentKey });
    await this.documentLockStore.releaseLock(documentKey);
  }
}

module.exports = DocumentService;
