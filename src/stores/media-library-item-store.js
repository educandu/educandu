import Database from './database.js';
import { validate } from '../domain/validation.js';
import { createTagsPipelineQuery } from '../utils/tag-utils.js';
import { mediaLibraryItemDbSchema } from '../domain/schemas/media-library-item-schemas.js';

class MediaLibraryItemStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.mediaLibraryItems;
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

  insertMediaLibraryItem(mediaLibraryItem, { session } = {}) {
    validate(mediaLibraryItem, mediaLibraryItemDbSchema);
    return this.collection.insertOne(mediaLibraryItem, { session });
  }

  updateMediaLibraryItem(mediaLibraryItem, { session } = {}) {
    validate(mediaLibraryItem, mediaLibraryItemDbSchema);
    return this.collection.updateOne({ _id: mediaLibraryItem._id }, mediaLibraryItem, { session });
  }
}

export default MediaLibraryItemStore;
