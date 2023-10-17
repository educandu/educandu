import Database from './database.js';
import { validate } from '../domain/validation.js';
import { documentInputMediaItemDbSchema } from '../domain/schemas/document-input-media-item-schemas.js';

class DocumentInputMediaItemStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.documentInputMediaItems;
  }

  getAllDocumentInputMediaItemByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { session }).toArray();
  }

  async insertDocumentInputMediaItem(documentInputMediaItem, { session } = {}) {
    validate(documentInputMediaItem, documentInputMediaItemDbSchema);
    await this.collection.insertOne(documentInputMediaItem, { session });
    return documentInputMediaItem;
  }

  async deleteDocumentInputMediaItem(documentInputMediaItemId, { session } = {}) {
    const result = await this.collection.deleteOne({ _id: documentInputMediaItemId }, { session });
    return result.value;
  }

  async deleteDocumentInputMediaItemsByRoomId(roomId, { session } = {}) {
    const result = await this.collection.deleteMany({ roomId }, { session });
    return result.value;
  }
}

export default DocumentInputMediaItemStore;
