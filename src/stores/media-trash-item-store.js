import Database from './database.js';
import { validate } from '../domain/validation.js';
import { mediaTrashItemDbSchema } from '../domain/schemas/media-trash-item-schemas.js';

const mediaTrashItemProjection = {
  'originalItem.searchTokens': 0
};

const mediaTrashItemMetadataProjection = {
  _id: 1,
  size: 1,
  createdOn: 1,
  name: 1
};

class MediaTrashItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.mediaTrashItems;
  }

  getAllMediaTrashItems({ session } = {}) {
    return this.collection.find({}, { projection: mediaTrashItemProjection, session }).toArray();
  }

  getMediaTrashItemMetadataById(mediaTrashItemId, { session } = {}) {
    return this.collection.findOne({ _id: mediaTrashItemId }, { projection: mediaTrashItemMetadataProjection, session });
  }

  getMediaTrashItemsMetadataCreatedBefore(beforeDate, { session } = {}) {
    return this.collection.find({ createdOn: { $lt: beforeDate } }, { projection: mediaTrashItemMetadataProjection, session }).toArray();
  }

  async insertMediaTrashItem(mediaTrashItem, { session } = {}) {
    validate(mediaTrashItem, mediaTrashItemDbSchema);

    await this.collection.insertOne(mediaTrashItem, { session });
    const insertedMediaTrashItem = await this.collection.findOne({ _id: mediaTrashItem._id }, { session });

    return insertedMediaTrashItem;
  }

  async deleteMediaTrashItem(mediaTrashItemId, { session } = {}) {
    await this.collection.deleteOne({ _id: mediaTrashItemId }, { session });
  }
}

export default MediaTrashItemStore;
