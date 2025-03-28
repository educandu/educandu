import Database from './database.js';
import { validate } from '../domain/validation.js';
import { combineQueryConditions, createTagsPipelineQuery } from '../utils/query-utils.js';
import { mediaLibraryItemDbSchema, mediaLibraryItemMetadataUpdateDbSchema } from '../domain/schemas/media-library-item-schemas.js';

const mediaLibraryItemProjection = {
  searchTokens: 0
};

class MediaLibraryItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.mediaLibraryItems;
  }

  getMediaLibraryItemById(mediaLibraryItemId, { session } = {}) {
    return this.collection.findOne({ _id: mediaLibraryItemId }, { projection: mediaLibraryItemProjection, session });
  }

  getMediaLibraryItemWithSearchTokensById(mediaLibraryItemId, { session } = {}) {
    return this.collection.findOne({ _id: mediaLibraryItemId }, { session });
  }

  getMediaLibraryItemByUrl(url, { session } = {}) {
    return this.collection.findOne({ url }, { projection: mediaLibraryItemProjection, session });
  }

  getMediaLibraryItemsCount({ session } = {}) {
    return this.collection.countDocuments({}, { session });
  }

  getAllMediaLibraryItems({ session } = {}) {
    return this.collection.find({}, { projection: mediaLibraryItemProjection, session }).toArray();
  }

  getMediaLibraryItemsWithSearchTokensByConditions(conditions, { session } = {}) {
    return this.collection.find(combineQueryConditions('$and', conditions), { session }).toArray();
  }

  getMediaLibraryItemTagsMatchingText(text) {
    const { isValid, query } = createTagsPipelineQuery(text);
    return isValid
      ? this.collection.aggregate(query).toArray()
      : Promise.resolve([]);
  }

  async getMediaLibraryItemsPageByConditions(conditions, { page, pageSize }, { session } = {}) {
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
              { $skip: (page - 1) * pageSize },
              { $limit: pageSize },
              { $project: mediaLibraryItemProjection }
            ]
          }
        }
      ], { session }).toArray();

    return {
      mediaLibraryItems: aggregatedArray[0]?.data || [],
      totalCount: aggregatedArray[0]?.metadata[0]?.totalCount || 0
    };
  }

  async insertMediaLibraryItem(mediaLibraryItem, { session } = {}) {
    validate(mediaLibraryItem, mediaLibraryItemDbSchema);

    await this.collection.insertOne(mediaLibraryItem, { session });
    const insertedMediaLibraryItem = await this.collection.findOne({ _id: mediaLibraryItem._id }, { projection: mediaLibraryItemProjection, session });

    return insertedMediaLibraryItem;
  }

  async updateMediaLibraryItem(mediaLibraryItemId, metadata, { session } = {}) {
    validate(metadata, mediaLibraryItemMetadataUpdateDbSchema);

    const filter = { _id: mediaLibraryItemId };
    const update = { $set: { ...metadata } };
    const options = { returnDocument: 'after', projection: mediaLibraryItemProjection, session };

    const value = await this.collection.findOneAndUpdate(filter, update, options);
    return value;
  }

  async deleteMediaLibraryItem(mediaLibraryItemId, { session } = {}) {
    await this.collection.deleteOne({ _id: mediaLibraryItemId }, { session });
  }
}

export default MediaLibraryItemStore;
