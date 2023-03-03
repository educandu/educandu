import Database from './database.js';
import { validate } from '../domain/validation.js';
import { createTagsPipelineQuery } from '../utils/tag-utils.js';
import { mediaLibraryItemDbSchema, mediaLibraryItemMetadataUpdateDbSchema } from '../domain/schemas/media-library-item-schemas.js';

class MediaLibraryItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.mediaLibraryItems;
  }

  getMediaLibraryItemById(mediaLibraryItemId, { session } = {}) {
    return this.collection.findOne({ _id: mediaLibraryItemId }, { session });
  }

  getAllMediaLibraryItems({ session } = {}) {
    return this.collection.find({}, { session }).toArray();
  }

  getMediaLibraryItemsByConditions(conditions, { session } = {}) {
    return this.collection.find({ $and: conditions }, { session }).toArray();
  }

  getMediaLibraryItemTagsMatchingText(text) {
    const { isValid, query } = createTagsPipelineQuery(text);
    return isValid
      ? this.collection.aggregate(query).toArray()
      : Promise.resolve([]);
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

    const result = await this.collection.findOneAndUpdate(filter, update, options);
    return result.value;
  }

  async deleteMediaLibraryItem(mediaLibraryItemId, { session } = {}) {
    const result = await this.collection.deleteOne({ _id: mediaLibraryItemId }, { session });
    return result.value;
  }
}

export default MediaLibraryItemStore;
