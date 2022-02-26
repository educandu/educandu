import Database from './database.js';
import { getTagsQuery } from './store-helper.js';
import { validate } from '../domain/validation.js';
import { documentDBSchema } from '../domain/schemas/document-schemas.js';

const documentMetadataProjection = {
  key: 1,
  revision: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const documentExtendedMetadataProjection = {
  _id: 1,
  key: 1,
  order: 1,
  revision: 1,
  title: 1,
  description: 1,
  slug: 1,
  language: 1,
  createdOn: 1,
  createdBy: 1,
  updatedOn: 1,
  updatedBy: 1,
  tags: 1,
  archived: 1,
  origin: 1,
  originUrl: 1
};

class DocumentStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.documents;
  }

  getDocumentByKey(key, { session } = {}) {
    return this.collection.findOne({ key }, { session });
  }

  getAllDocumentRevisionsByKey(documentKey, { session } = {}) {
    return this.collection.find({ key: documentKey }, { sort: [['order', 1]], session }).toArray();
  }

  getAllNonArchivedDocumentsExtendedMetadata({ session } = {}) {
    return this.collection.find({ archived: false }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getAllDocumentsExtendedMetadata({ session } = {}) {
    return this.collection.find({}, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getDocumentsExtendedMetadataByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getDocumentTagsMatchingText(text) {
    return this.collection.aggregate(getTagsQuery(text)).toArray();
  }

  getNonArchivedDocumentsMetadataByOrigin(origin, { session } = {}) {
    return this.collection.find(
      { archived: false, origin },
      { projection: documentMetadataProjection, session }
    ).toArray();
  }

  saveDocument(document, { session } = {}) {
    validate(document, documentDBSchema);
    return this.collection.replaceOne({ _id: document._id }, document, { session, upsert: true });
  }

  deleteDocumentByKey(key, { session } = {}) {
    return this.collection.deleteOne({ key }, { session });
  }
}

export default DocumentStore;
