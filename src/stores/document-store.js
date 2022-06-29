import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentDBSchema } from '../domain/schemas/document-schemas.js';

const documentMetadataProjection = {
  _id: 1,
  key: 1,
  revision: 1,
  createdOn: 1,
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
  originUrl: 1,
  contributors: 1
};

class DocumentStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.documents;
  }

  getDocumentByKey(key, { session } = {}) {
    return this.collection.findOne({ key }, { session });
  }

  getDocumentMetadataByKey(key, { session } = {}) {
    return this.collection.findOne({ key }, { projection: documentMetadataProjection, session });
  }

  getAllDocumentRevisionsByKey(documentKey, { session } = {}) {
    return this.collection.find({ key: documentKey }, { sort: [['order', 1]], session }).toArray();
  }

  getAllDocumentKeys({ session } = {}) {
    return this.collection.distinct('key', {}, { session });
  }

  getDocumentsMetadataByKeys(keys, { session } = {}) {
    return this.collection.find({ key: { $in: keys } }, { session }).toArray();
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

  getDocumentsMetadataByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentMetadataProjection, session }).toArray();
  }

  getDocumentTagsMatchingText(text) {
    return this.collection.aggregate(this._getTagsQuery(text)).toArray();
  }

  getNonArchivedDocumentsMetadataByOrigin(origin, { session } = {}) {
    return this.collection.find(
      { archived: false, origin },
      { projection: documentMetadataProjection, session }
    ).toArray();
  }

  getLatestDocumentsMetadataCreatedByUser(createdBy, { session, limit } = {}) {
    return this.collection.find(
      { createdBy },
      { projection: documentMetadataProjection, session }
    ).sort({ createdOn: -1 }).limit(limit || 0).toArray();
  }

  getLatestDocumentsMetadataUpdatedByUser(updatedBy, { session, limit } = {}) {
    return this.collection.find(
      { $and: [{ updatedBy }, { $expr: { $ne: ['$createdOn', '$updatedOn'] } }] },
      { projection: documentMetadataProjection, session }
    ).sort({ updatedOn: -1 }).limit(limit || 0).toArray();
  }

  saveDocument(document, { session } = {}) {
    validate(document, documentDBSchema);
    return this.collection.replaceOne({ _id: document._id }, document, { session, upsert: true });
  }

  deleteDocumentByKey(key, { session } = {}) {
    return this.collection.deleteOne({ key }, { session });
  }

  _getTagsQuery(searchString) {
    return [
      { $unwind: '$tags' },
      { $match: { tags: { $regex: `.*${searchString}.*`, $options: 'i' } } },
      { $group: { _id: null, uniqueTags: { $push: '$tags' } } },
      { $project: {
        _id: 0,
        uniqueTags: {
          $reduce: {
            input: '$uniqueTags',
            initialValue: [],
            in: {
              $let: {
                vars: { elem: { $concatArrays: [['$$this'], '$$value'] } },
                in: { $setUnion: '$$elem' }
              }
            }
          }
        }
      } }
    ];
  }
}

export default DocumentStore;
