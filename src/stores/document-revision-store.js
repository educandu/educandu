import Database from './database.js';
import { validate } from '../domain/validation.js';
import { combineQueryConditions } from '../utils/query-utils.js';
import { documentRevisionDBSchema } from '../domain/schemas/document-schemas.js';

const documentRevisionCreationProjection = {
  _id: 1,
  documentId: 1,
  createdOn: 1,
  createdBy: 1,
};

class DocumentRevisionStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentRevisions;
  }

  getDocumentRevisionById(documentRevisionId, { session } = {}) {
    return this.collection.findOne({ _id: documentRevisionId }, { session });
  }

  getAllDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.find({ documentId }, { sort: [['order', 1]], session }).toArray();
  }

  getAllPublicDocumentRevisionCreationMetadataCursorInInterval({ createdBy, from, until }, { session } = {}) {
    const conditions = [{ roomId: null }];

    if (createdBy) {
      conditions.push({ createdBy });
    }

    if (from) {
      conditions.push({ createdOn: { $gt: from } });
    }

    if (until) {
      conditions.push({ createdOn: { $lt: until } });
    }

    const filter = combineQueryConditions('$and', conditions, false);

    return this.collection.find(filter, { projection: documentRevisionCreationProjection, session });
  }

  getFirstAffectedDocumentRevisionsPerDocumentByReferencedCdnResourceName(cdnResourceName) {
    const pipeline = [
      {
        $match: {
          cdnResources: cdnResourceName
        }
      }, {
        $group: {
          _id: '$documentId',
          affectedRevisionCount: {
            $count: {}
          },
          firstRevision: {
            $top: {
              output: {
                _id: '$_id',
                title: '$title'
              },
              sortBy: {
                order: 1
              }
            }
          },
          roomIds: {
            $addToSet: '$roomId'
          }
        }
      }, {
        $set: {
          _id: '$firstRevision._id',
          documentId: '$_id',
          roomId: {
            $arrayElemAt: ['$roomIds', 0]
          },
          title: '$firstRevision.title'
        }
      }, {
        $lookup: {
          from: 'documents',
          let: {
            documentId: '$documentId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$documentId']
                }
              }
            }, {
              $project: {
                _id: 1,
                title: 1,
                slug: 1,
                publicContext: 1,
                cdnResources: 1
              }
            }
          ],
          as: 'document'
        }
      }, {
        $unwind: '$document'
      }, {
        $set: {
          documentTitle: '$document.title',
          documentSlug: '$document.slug',
          isDocumentArchived: {
            $cond: {
              if: {
                $eq: ['$document.publicContext.archived', true]
              },
              then: true,
              else: false
            }
          },
          isResourceUsedInDocument: {
            $cond: {
              if: {
                $in: [cdnResourceName, '$document.cdnResources']
              },
              then: true,
              else: false
            }
          }
        }
      }, {
        $unset: ['roomIds', 'firstRevision', 'document']
      }
    ];

    // Returns:
    // [
    //   {
    //     _id: "414eDHLpeoLaw8Rr4w5fFZ", // id of the first affected revision
    //     documentId: "u3YZtRTG2iQDdX2FmS6qfz",
    //     roomId: null,
    //     title: "Tetrachorde und Tonleitern", // title of the first affected revision ("historic")
    //     documentTitle: "Tetrachorde und Tonleitern", // title of the associated document ("current")
    //     documentSlug: "musik-tetrachorde-und-tonleitern",
    //     isDocumentArchived: false,
    //     isResourceUsedInDocument: true, // means the current document: if false, then it is "not used anymore"
    //     affectedRevisionCount: 24 // total number of document revisions that reference the resource
    //   },
    //   ...
    // ]

    return this.collection.aggregate(pipeline).toArray();
  }

  saveDocumentRevision(documentRevision, { session } = {}) {
    validate(documentRevision, documentRevisionDBSchema);
    return this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true });
  }

  saveDocumentRevisions(documentRevisions, { session } = {}) {
    documentRevisions.forEach(documentRevision => validate(documentRevision, documentRevisionDBSchema));
    return Promise.all(documentRevisions
      .map(documentRevision => this.collection.replaceOne({ _id: documentRevision._id }, documentRevision, { session, upsert: true })));
  }

  deleteDocumentRevisionsByDocumentId(documentId, { session } = {}) {
    return this.collection.deleteMany({ documentId }, { session });
  }

  deleteDocumentsByRoomId(roomId, { session }) {
    return this.collection.deleteMany({ roomId }, { session });
  }
}

export default DocumentRevisionStore;
