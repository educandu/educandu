import Database from './database.js';
import uniqueId from '../utils/unique-id.js';
import { validate } from '../domain/validation.js';
import { EVENT_TYPE } from '../domain/constants.js';
import { eventDbSchema } from '../domain/schemas/event-schemas.js';

class EventStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.events;
  }

  getEventById(eventId, { session } = {}) {
    return this.collection.findOne({ _id: eventId }, { session });
  }

  recordRevisionCreatedEvent({ revision, user }, { session } = {}) {
    return this._recordEvent(
      EVENT_TYPE.revisionCreated,
      { userId: user._id, documentId: revision.documentId, revisionId: revision._id, roomId: revision.roomId },
      { session }
    );
  }

  recordCommentCreatedEvent({ comment, document, user }, { session } = {}) {
    return this._recordEvent(
      EVENT_TYPE.commentCreated,
      { userId: user._id, documentId: comment.documentId, commentId: comment._id, roomId: document.roomId },
      { session }
    );
  }

  async _recordEvent(type, params, { session } = {}) {
    const event = {
      _id: uniqueId.create(),
      type,
      params,
      createdOn: new Date(),
      processedOn: null
    };
    await this.insertEvent(event, { session });
    return event;
  }

  async insertEvent(event, { session } = {}) {
    validate(event, eventDbSchema);
    await this.collection.insertOne(event, { session });
    return event;
  }

  async setEventProcessedOn(eventId, processedOn, { session } = {}) {
    await this.collection.updateOne({ _id: eventId }, { processedOn }, { session });
  }

  async deleteEvent(eventId, { session } = {}) {
    const result = await this.collection.deleteOne({ _id: eventId }, { session });
    return result.value;
  }
}

export default EventStore;
