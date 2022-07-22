import Database from './database.js';
import { validate } from '../domain/validation.js';
import { DOCUMENT_ACCESS } from '../domain/constants.js';
import { documentDBSchema } from '../domain/schemas/document-schemas.js';

const documentMetadataProjection = {
  _id: 1,
  revision: 1,
  createdOn: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const documentExtendedMetadataProjection = {
  _id: 1,
  roomId: 1,
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
  review: 1,
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

  getDocumentById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  getDocumentMetadataById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { projection: documentMetadataProjection, session });
  }

  getDocumentsMetadataBySlug(slug, { session } = {}) {
    return this.collection.find({ slug }, { projection: documentMetadataProjection, session }.toArray());
  }

  getAllDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { sort: [['order', 1]], session }).toArray();
  }

  getAllDocumentIds({ session } = {}) {
    return this.collection.distinct('_id', {}, { session });
  }

  getDocumentsMetadataByIds(ids, { session } = {}) {
    return this.collection.find({ _id: { $in: ids } }, { session }).toArray();
  }

  getDocumentsMetadataByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { session }).toArray();
  }

  getDocumentsMetadataByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentMetadataProjection, session }).toArray();
  }

  getDocumentsExtendedMetadataByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getPublicNonArchivedTaggedDocumentsExtendedMetadata({ session } = {}) {
    return this.collection.find({
      archived: false,
      access: DOCUMENT_ACCESS.public,
      $expr: { $gt: [{ $size: '$tags' }, 0] }
    }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getDocumentTagsMatchingText(text) {
    return this.collection.aggregate(this._getTagsQuery(text)).toArray();
  }

  getPublicNonArchivedDocumentsMetadataByOrigin(origin, { session } = {}) {
    return this.collection.find(
      { archived: false, origin, access: DOCUMENT_ACCESS.public },
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

  deleteDocumentById(id, { session } = {}) {
    return this.collection.deleteOne({ _id: id }, { session });
  }

  deleteDocumentsByRoomId(roomId, { session }) {
    return this.collection.deleteMany({ roomId }, { session });
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
