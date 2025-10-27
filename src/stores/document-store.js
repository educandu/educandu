import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentDBSchema } from '../domain/schemas/document-schemas.js';
import { combineQueryConditions, createTagsPipelineQuery } from '../utils/query-utils.js';

const documentTagsProjection = {
  _id: 1,
  tags: 1
};

const documentMinimalMetadataWithTagsProjection = {
  _id: 1,
  title: 1,
  slug: 1,
  tags: 1
};

const documentCreationMetadataProjection = {
  _id: 1,
  createdOn: 1,
  createdBy: 1,
  title: 1,
  slug: 1
};

const documentMetadataProjection = {
  _id: 1,
  revision: 1,
  createdOn: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1,
  roomId: 1
};

const roomDocumentMetadataProjection = {
  '_id': 1,
  'roomId': 1,
  'order': 1,
  'revision': 1,
  'title': 1,
  'shortDescription': 1,
  'slug': 1,
  'language': 1,
  'createdOn': 1,
  'createdBy': 1,
  'updatedOn': 1,
  'updatedBy': 1,
  'tags': 1,
  'contributors': 1,
  'cdnResources': 1,
  'roomContext.draft': 1,
  'roomContext.inputSubmittingDisabled': 1
};

const contributedDocumentMetadataProjection = {
  _id: 1,
  title: 1,
  shortDescription: 1,
  createdOn: 1,
  createdBy: 1,
  updatedOn: 1,
  updatedBy: 1,
  contributors: 1
};

const documentExtendedMetadataProjection = {
  '_id': 1,
  'roomId': 1,
  'order': 1,
  'revision': 1,
  'title': 1,
  'shortDescription': 1,
  'slug': 1,
  'language': 1,
  'createdOn': 1,
  'createdBy': 1,
  'updatedOn': 1,
  'updatedBy': 1,
  'tags': 1,
  'contributors': 1,
  'publicContext.allowedEditors': 1,
  'publicContext.protected': 1,
  'publicContext.archived': 1,
  'publicContext.archiveRedirectionDocumentId': 1,
  'publicContext.verified': 1,
  'publicContext.review': 1,
  'roomContext.draft': 1,
  'roomContext.inputSubmittingDisabled': 1
};

const documentExtendedMetadataWithSearchTokensProjection = {
  ...documentExtendedMetadataProjection,
  searchTokens: 1
};

class DocumentStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documents;
  }

  getDocumentById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  getDocumentMetadataById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { projection: documentMetadataProjection, session });
  }

  getDocumentsCreationMetadataByIds(ids, { session } = {}) {
    return this.collection.find({ _id: { $in: ids } }, { projection: documentCreationMetadataProjection, session }).toArray();
  }

  getRoomDocumentsMetadataByDocumentIds(ids, { session } = {}) {
    return this.collection.find({ _id: { $in: ids } }, { projection: roomDocumentMetadataProjection, session }).toArray();
  }

  getDocumentsMetadataByIds(ids, { session } = {}) {
    return this.collection.find({ _id: { $in: ids } }, { projection: documentMetadataProjection, session }).toArray();
  }

  getDocumentsExtendedMetadataByIds(ids, { session } = {}) {
    return this.collection.find({ _id: { $in: ids } }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getDocumentsMetadataBySlug(slug, { session } = {}) {
    return this.collection.find({ slug }, { projection: documentMetadataProjection, session }).toArray();
  }

  getPublicNonArchivedTaggedDocumentsCount({ session } = {}) {
    return this.collection.countDocuments(
      {
        'roomId': null,
        'publicContext.archived': false,
        '$expr': { $gt: [{ $size: '$tags' }, 0] }
      },
      { session }
    );
  }

  getPublicNonArchivedDocumentsByContributingUser(contributingUserId, { session } = {}) {
    return this.collection.find(
      {
        'roomId': null,
        'publicContext.archived': false,
        'contributors': contributingUserId
      },
      { projection: contributedDocumentMetadataProjection, session }
    ).toArray();
  }

  getPublicNonArchivedDocumentsByCreatingUser(creatingUserId, { session } = {}) {
    return this.collection.find(
      {
        'roomId': null,
        'publicContext.archived': false,
        'createdBy': creatingUserId
      },
      { projection: contributedDocumentMetadataProjection, session }
    ).toArray();
  }

  getAllDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { sort: [['order', 1]], session }).toArray();
  }

  getAllDocumentIds({ session } = {}) {
    return this.collection.distinct('_id', {}, { session });
  }

  getDocumentsMetadataByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { session }).toArray();
  }

  getDocumentsTagsByConditions(conditions, { session } = {}) {
    const predicate = conditions.length ? { $and: conditions } : {};
    return this.collection.find(predicate, { projection: documentTagsProjection, session }).toArray();
  }

  getDocumentsMetadataByConditions(conditions, { session } = {}) {
    const predicate = combineQueryConditions('$and', conditions, true) || {};
    return this.collection.find(predicate, { projection: documentMetadataProjection, session }).toArray();
  }

  getDocumentsExtendedMetadataByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getDocumentsExtendedMetadataWithSearchTokensByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { projection: documentExtendedMetadataWithSearchTokensProjection, session }).toArray();
  }

  async getDocumentsExtendedMetadataPageByConditions(conditions, { page, pageSize }, { session } = {}) {
    const aggregatedArray = await this.collection
      .aggregate([
        {
          $match: { $and: conditions }
        }, {
          $sort: { updatedOn: -1 }
        }, {
          $facet: {
            metadata: [{ $count: 'totalCount' }],
            data: [
              { $skip: (page - 1) * pageSize }, { $limit: pageSize },
              { $project: documentExtendedMetadataProjection }
            ]
          }
        }
      ], { session }).toArray();

    return {
      documents: aggregatedArray[0]?.data || [],
      totalCount: aggregatedArray[0]?.metadata[0]?.totalCount || 0
    };
  }

  getPublicNonArchivedTaggedDocumentsExtendedMetadata({ session } = {}) {
    return this.collection.find({
      'roomId': null,
      'publicContext.archived': false,
      '$expr': { $gt: [{ $size: '$tags' }, 0] }
    }, { projection: documentExtendedMetadataProjection, session }).toArray();
  }

  getPublicNonArchivedDocumentsMinimalMetadataWithTagsCursorByTag(tag, { session } = {}) {
    return this.collection.find({
      'roomId': null,
      'publicContext.archived': false,
      'tags': tag
    }, { projection: documentMinimalMetadataWithTagsProjection, session });
  }

  getDocumentTagsMatchingText(text) {
    const { isValid, query } = createTagsPipelineQuery(text);
    return isValid
      ? this.collection.aggregate(query).toArray()
      : Promise.resolve([]);
  }

  getPublicNonArchivedDocumentTagsWithCountsCursor({ session } = {}) {
    return this.collection.aggregate([
      {
        $match: {
          'roomId': null,
          'publicContext.archived': false
        }
      },
      {
        $unwind: '$tags'
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      }
    ], { session });
  }

  getAllCdnResourcesReferencedFromNonArchivedDocuments() {
    return this.collection.distinct('cdnResources', { 'roomId': null, 'publicContext.archived': false });
  }

  getAllTrackedCdnResourcesReferencedFromNonArchivedDocuments() {
    return this.collection.distinct('trackedCdnResources', { 'roomId': null, 'publicContext.archived': false });
  }

  getAllTrackedCdnResourcesReferencedFromArchivedDocuments() {
    return this.collection.distinct('trackedCdnResources', { 'roomId': null, 'publicContext.archived': true });
  }

  getAllTrackedCdnResourcesReferencedFromRoomDocuments() {
    return this.collection.distinct('trackedCdnResources', { roomId: { $ne: null } });
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
}

export default DocumentStore;
