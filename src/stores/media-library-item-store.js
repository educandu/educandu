import Database from './database.js';
import { validate } from '../domain/validation.js';
import { combineQueryConditions, createTagsPipelineQuery } from '../utils/query-utils.js';
import { mediaLibraryItemDbSchema, mediaLibraryItemMetadataUpdateDbSchema } from '../domain/schemas/media-library-item-schemas.js';

class MediaLibraryItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.mediaLibraryItems;
  }

  getMediaLibraryItemById(mediaLibraryItemId, { session } = {}) {
    return this.collection.findOne({ _id: mediaLibraryItemId }, { session });
  }

  getMediaLibraryItemByUrl(url, { session } = {}) {
    return this.collection.findOne({ url }, { session });
  }

  getAllMediaLibraryItems({ session } = {}) {
    return this.collection.find({}, { session }).toArray();
  }

  getMediaLibraryItemsByConditions(conditions, { session } = {}) {
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
            data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }]
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
    return mediaLibraryItem;
  }

  async updateMediaLibraryItem(mediaLibraryItemId, metadata, { session } = {}) {
    validate(metadata, mediaLibraryItemMetadataUpdateDbSchema);

    const filter = { _id: mediaLibraryItemId };
    const update = { $set: { ...metadata } };
    const options = { returnDocument: 'after', session };

    const value = await this.collection.findOneAndUpdate(filter, update, options);
    return value;
  }

  async deleteMediaLibraryItem(mediaLibraryItemId, { session } = {}) {
    const result = await this.collection.deleteOne({ _id: mediaLibraryItemId }, { session });
    return result.value;
  }
}

export default MediaLibraryItemStore;
