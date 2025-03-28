import Database from './database.js';
import { validate } from '../domain/validation.js';
import { mediaTrashItemDbSchema } from '../domain/schemas/media-trash-item-schemas.js';

class MediaTrashItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.mediaTrashItems;
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
