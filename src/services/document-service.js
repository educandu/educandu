const DocumentSnapshotStore = require('../stores/document-snapshot-store');
const DocumentOrderStore = require('../stores/document-order-store');
const SectionOrderStore = require('../stores/section-order-store');
const DocumentLockStore = require('../stores/document-lock-store');
const HandlerFactory = require('../plugins/handler-factory');
const DocumentStore = require('../stores/document-store');
const SectionStore = require('../stores/section-store');
const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');
const UserService = require('./user-service');
const deepEqual = require('fast-deep-equal');
const Logger = require('../common/logger');

const logger = new Logger(__filename);

class DocumentService {
  static get inject() {
    return [DocumentSnapshotStore, DocumentOrderStore, SectionOrderStore, DocumentLockStore, DocumentStore, SectionStore, UserService, HandlerFactory];
  }

  constructor(documentSnapshotStore, documentOrderStore, sectionOrderStore, documentLockStore, documentStore, sectionStore, userService, handlerFactory) {
    this.documentSnapshotStore = documentSnapshotStore;
    this.documentOrderStore = documentOrderStore;
    this.sectionOrderStore = sectionOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
    this.sectionStore = sectionStore;
    this.userService = userService;
    this.handlerFactory = handlerFactory;
  }

  getLastUpdatedDocuments(numberOfDocs = 0) {
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

  async *getDocumentKeys() {
    const groups = this.documentSnapshotStore.aggregate({
      pipeline: [{ $group: { _id: '$key' } }]
    });

    for await (const group of groups) {
      yield group._id;
    }
  }

  getDocumentById(documentId) {
    return this.documentStore.findOne({
      query: { _id: documentId }
    });
  }

  async getDocumentHistory(documentKey) {
    const snapshots = await this.documentSnapshotStore.find({
      query: { key: documentKey },
      sort: [['order', 1]]
    });

    if (!snapshots.length) {
      return [];
    }

    const sectionsById = new Map();
    const usersById = new Map();

    snapshots.forEach(snapshot => {
      this.getAllUserIdsForSnapshot(snapshot).forEach(userId => usersById.set(userId, null));
      snapshot.sections.forEach(section => {
        sectionsById.set(section.id, null);
        this.getAllUserIdsForSection(section).forEach(userId => usersById.set(userId, null));
      });
    });

    const sections = await this.getSectionsByIds(Array.from(sectionsById.keys()));
    sections.forEach(section => sectionsById.set(section._id, section));

    const users = await this.userService.getUsersByIds(Array.from(usersById.keys()));
    users.forEach(user => usersById.set(user._id, user));

    for (const [id, section] in sectionsById.entries()) {
      if (!section) {
        throw new Error(`Section with ID ${id} is referenced but could not be found in the database.`);
      }
    }

    for (const [id, user] in usersById.entries()) {
      if (!user) {
        throw new Error(`User with ID ${id} is referenced but could not be found in the database.`);
      }
    }

    snapshots.forEach(snapshot => this.setUserObjectsInSnapshot(snapshot, usersById));
    sections.forEach(section => this.setUserObjectsInSection(section, usersById));

    const firstSnapshot = snapshots[0];
    return snapshots.map(lastSnapshot => {
      const sectionsInLastSnapshot = lastSnapshot.sections.map(section => sectionsById.get(section.id));
      const latestSnapshot = this.createLatestDocument(documentKey, firstSnapshot, lastSnapshot, sectionsInLastSnapshot);
      return latestSnapshot;
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

  async getSectionsByIds(sectionIds) {
    if (!sectionIds.length) {
      return [];
    }

    const sections = await this.sectionStore.find({
      query: { _id: { $in: sectionIds } }
    });

    return sectionIds
      .map(id => sections.find(section => section._id === id))
      .filter(section => !!section);
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

  async hardDeleteSection({ key, order, reason, deleteDescendants, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    const now = dateTime.now();

    const selectByKey = { key };
    const selectByOrder = deleteDescendants ? { order: { $gte: order } } : { order };
    const sectionsQuery = { $and: [selectByKey, selectByOrder] };

    const fieldsToSet = {
      content: null,
      deletedOn: now,
      deletedBy: { id: user._id },
      deletedBecause: reason
    };

    logger.info('Hard-deleting content for sections with key %s and order %s %s', key, deleteDescendants ? '>=' : '=', order);
    const sections = await this.sectionStore.find({ query: sectionsQuery });
    if (!sections.length) {
      logger.info('No sections found with key %s and order %s %s', key, deleteDescendants ? '>=' : '=', order);
      return;
    }

    const sectionIds = sections.map(section => section._id);
    const handlersBySectionId = sections.reduce((map, section) => {
      map.set(section._id, this.handlerFactory.createHandler(section.type));
      return map;
    }, new Map());

    logger.info('Calling before hard delete plugin handlers');
    await Promise.all(sections.map(section => {
      const handler = handlersBySectionId.get(section._id);
      return handler && handler.handleBeforeHardDelete && handler.handleBeforeHardDelete(section);
    }));

    await this.sectionStore.updateMany({ _id: { $in: sectionIds } }, { $set: fieldsToSet });
    logger.info('%s sections were hard-deleted', sections.length);

    logger.info('Calling after hard delete plugin handlers');
    await Promise.all(sections.map(section => {
      const handler = handlersBySectionId.get(section._id);
      return handler && handler.handleAfterHardDelete && handler.handleAfterHardDelete(section, { ...section, ...fieldsToSet });
    }));

    logger.info('Searching for documents referencing hard-deleted sections');
    const docs = await this.documentStore.find({
      query: { sections: { $elemMatch: { _id: { $in: sectionIds } } } },
      projection: { _id: 1 }
    });

    const docKeys = docs.map(doc => doc._id);
    logger.info('Found %s documents referencing hard-deleted sections', docKeys.length);

    logger.info('Obtaining document locks');
    await Promise.all(docKeys.map(docKey => this.documentLockStore.takeLock(docKey)));

    logger.info('Regenerating documents');
    await Promise.all(docKeys.map(docKey => this.regenerateLatestDocumentUnlocked(docKey)));

    logger.info('Releasing document locks');
    await Promise.all(docKeys.map(docKey => this.documentLockStore.releaseLock(docKey)));

    logger.info('Hard-delete completed');
  }

  async createDocumentRevision({ doc, sections, user }) {
    if (!user || !user._id) {
      throw new Error('No user specified');
    }

    const now = dateTime.now();
    const documentKey = doc.key || uniqueId.create();

    logger.info('Creating new document revision for document key %s', documentKey);

    await this.documentLockStore.takeLock(documentKey);

    const latestSnapshot = await this.getLatestDocumentSnapshot(documentKey);
    if (latestSnapshot) {
      logger.info('Found existing snapshot with id %s', latestSnapshot._id);
    } else {
      logger.info('No existing snapshot found for document key %s', documentKey);
    }

    if (!this.userCanUpdateDoc(latestSnapshot, doc, user)) {
      throw new Error('The user does not have permission to update the document');
    }

    const updatedSections = await Promise.all(sections.map(async section => {
      logger.info('Processing section with key %s', section.key);

      // Load potentially existing revision:
      const existingSection = section.ancestorId ? await this.getSectionById(section.ancestorId) : null;
      if (existingSection) {
        logger.info('Found ancestor section with id %s', existingSection._id);
      } else {
        logger.info('No ancestor section found');
      }

      if (existingSection && section.type && existingSection.type !== section.type) {
        throw new Error('Sections cannot change their type');
      }

      if (existingSection && section.key && existingSection.key !== section.key) {
        throw new Error('Sections cannot change their key');
      }

      if (!existingSection && !section.type) {
        throw new Error('New sections must specify a type');
      }

      // If not changed, re-use existing revision:
      if (existingSection && deepEqual(existingSection.content, section.content)) {
        logger.info('Section has not changed compared to ancestor section with id %s, using the existing', existingSection._id);
        return existingSection;
      }

      if (!section.content) {
        throw new Error('Sections must specify a content');
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

      logger.info('Saving new section revision with id %s', newRevision._id);
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

    logger.info('Saving new document snapshot with id %s', newSnapshot._id);
    await this.documentSnapshotStore.save(newSnapshot);

    const firstSnapshot = await this.getInitialDocumentSnapshot(documentKey);

    const latestDocument = this.createLatestDocument(documentKey, firstSnapshot, newSnapshot, updatedSections);

    logger.info('Latest document will have %s', latestDocument._id);
    await this.documentStore.save(latestDocument);

    await this.documentLockStore.releaseLock(documentKey);

    return latestDocument;
  }

  createLatestDocument(documentKey, firstSnapshot, lastSnapshot, sections) {
    return {
      _id: documentKey,
      snapshotId: lastSnapshot._id,
      createdOn: firstSnapshot.createdOn,
      updatedOn: lastSnapshot.createdOn,
      createdBy: firstSnapshot.createdBy,
      updatedBy: lastSnapshot.createdBy,
      order: lastSnapshot.order,
      title: lastSnapshot.title,
      slug: lastSnapshot.slug,
      sections: sections
    };
  }

  async regenerateLatestDocument(documentKey) {
    await this.documentLockStore.takeLock(documentKey);
    await this.regenerateLatestDocumentUnlocked(documentKey);
    await this.documentLockStore.releaseLock(documentKey);
  }

  async regenerateLatestDocumentUnlocked(documentKey) {
    const firstSnapshot = await this.getInitialDocumentSnapshot(documentKey);
    const lastSnapshot = await this.getLatestDocumentSnapshot(documentKey);
    const sections = await this.getSectionsByIds(lastSnapshot.sections.map(section => section.id));

    const latestDocument = this.createLatestDocument(documentKey, firstSnapshot, lastSnapshot, sections);
    await this.documentStore.save(latestDocument);
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

  getAllUserIdsForSnapshot(snapshot) {
    const ids = [snapshot.createdBy].filter(x => x && x.id).map(x => x.id);
    return Array.from(new Set(ids));
  }

  getAllUserIdsForSection(section) {
    const ids = [section.createdBy, section.deletedBy].filter(x => x && x.id).map(x => x.id);
    return Array.from(new Set(ids));
  }

  setUserObjectsInSnapshot(snapshot, usersById) {
    if (snapshot.createdBy && snapshot.createdBy.id) {
      snapshot.createdBy = usersById.get(snapshot.createdBy.id);
    }
  }

  setUserObjectsInSection(section, usersById) {
    if (section.createdBy && section.createdBy.id) {
      section.createdBy = usersById.get(section.createdBy.id);
    }

    if (section.deletedBy && section.deletedBy.id) {
      section.deletedBy = usersById.get(section.deletedBy.id);
    }
  }
}

module.exports = DocumentService;
