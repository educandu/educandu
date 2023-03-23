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

  async getOldestUnprocessedEventId({ session } = {}) {
    const latestUnprocessedEvents = await this.collection
      .find({ processedOn: null }, { projection: { _id: 1 }, session })
      .sort({ createdOn: -1 })
      .limit(1)
      .toArray();

    return latestUnprocessedEvents[0]?._id || null;
  }

  recordDocumentRevisionCreatedEvent({ documentRevision, user }, { session } = {}) {
    return this._recordEvent(
      EVENT_TYPE.documentRevisionCreated,
      { userId: user._id, documentId: documentRevision.documentId, documentRevisionId: documentRevision._id, roomId: documentRevision.roomId },
      { session }
    );
  }

  recordDocumentCommentCreatedEvent({ documentComment, document, user }, { session } = {}) {
    return this._recordEvent(
      EVENT_TYPE.documentCommentCreated,
      { userId: user._id, documentId: documentComment.documentId, documentCommentId: documentComment._id, roomId: document.roomId },
      { session }
    );
  }

  recordRoomMessageCreatedEvent({ userId, roomId, roomMessageKey }, { session } = {}) {
    return this._recordEvent(
      EVENT_TYPE.roomMessageCreated,
      { userId, roomId, roomMessageKey },
      { session }
    );
  }

  async _recordEvent(type, params, { session } = {}) {
    const event = {
      _id: uniqueId.create(),
      type,
      params,
      createdOn: new Date(),
      processedOn: null,
      processingErrors: []
    };
    await this.insertEvent(event, { session });
    return event;
  }

  async insertEvent(event, { session } = {}) {
    validate(event, eventDbSchema);
    await this.collection.insertOne(event, { session });
    return event;
  }

  updateEvent(event, { session } = {}) {
    validate(event, eventDbSchema);
    return this.collection.replaceOne({ _id: event._id }, event, { session });
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
