import moment from 'moment';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import LockStore from '../stores/lock-store.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import { serializeError } from 'serialize-error';
import EventStore from '../stores/event-store.js';
import DocumentStore from '../stores/document-store.js';
import notificationUtils from '../utils/notification-utils.js';
import NotificationStore from '../stores/notification-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentInputStore from '../stores/document-input-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { EVENT_TYPE, NOTIFICATION_EXPIRATION_IN_MONTHS } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

const MAX_PROCESSING_ATTEMPTS = 3;

const PROCESSING_RESULT = {
  succeeded: 'succeeded',
  cancelled: 'cancelled',
  failed: 'failed'
};

const createNotificationForEvent = ({ event, user, reasons }) => {
  return {
    _id: uniqueId.create(),
    notifiedUserId: user._id,
    eventId: event._id,
    eventType: event.type,
    eventParams: event.params,
    reasons,
    createdOn: event.createdOn,
    expiresOn: moment(event.createdOn).add(NOTIFICATION_EXPIRATION_IN_MONTHS, 'months').toDate()
  };
};

class EventService {
  static dependencies = [
    EventStore,
    NotificationStore,
    UserStore,
    DocumentStore,
    DocumentRevisionStore,
    DocumentInputStore,
    RoomStore,
    LockStore,
    TransactionRunner
  ];

  constructor(
    eventStore,
    notificationStore,
    userStore,
    documentStore,
    documentRevisionStore,
    documentInputStore,
    roomStore,
    lockStore,
    transactionRunner
  ) {
    this.eventStore = eventStore;
    this.notificationStore = notificationStore;
    this.userStore = userStore;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
    this.documentInputStore = documentInputStore;
    this.roomStore = roomStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
  }

  async _processDocumentRevisionCreatedEvent(event, context) {
    const userIterator = this.userStore.getActiveUsersIterator();

    try {
      const { documentRevisionId, documentId, roomId } = event.params;
      const documentRevision = await this.documentRevisionStore.getDocumentRevisionById(documentRevisionId);
      const document = await this.documentStore.getDocumentById(documentId);
      const room = roomId ? await this.roomStore.getRoomById(roomId) : null;

      const createdNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          return {
            status: PROCESSING_RESULT.cancelled,
            notifications: []
          };
        }

        const reasons = notificationUtils.determineNotificationReasonsForDocumentRevisionCreatedEvent({
          event,
          documentRevision,
          document,
          room,
          notifiedUser: user
        });

        if (reasons.length) {
          createdNotifications.push(createNotificationForEvent({ event, user, reasons }));
        }
      }

      return {
        status: PROCESSING_RESULT.succeeded,
        notifications: createdNotifications
      };
    } finally {
      await userIterator.close();
    }
  }

  async _processDocumentCommentCreatedEvent(event, context) {
    const userIterator = this.userStore.getActiveUsersIterator();

    try {
      const { documentId, roomId } = event.params;
      const document = await this.documentStore.getDocumentById(documentId);
      const room = roomId ? await this.roomStore.getRoomById(roomId) : null;

      const createdNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          return {
            status: PROCESSING_RESULT.cancelled,
            notifications: []
          };
        }

        const reasons = notificationUtils.determineNotificationReasonsForDocumentCommentCreatedEvent({
          event,
          document,
          room,
          notifiedUser: user
        });

        if (reasons.length) {
          createdNotifications.push(createNotificationForEvent({ event, user, reasons }));
        }
      }

      return {
        status: PROCESSING_RESULT.succeeded,
        notifications: createdNotifications
      };
    } finally {
      await userIterator.close();
    }
  }

  async _processRoomMessageCreatedEvent(event, context) {
    const userIterator = this.userStore.getActiveUsersIterator();

    try {
      const { roomId } = event.params;
      const room = await this.roomStore.getRoomById(roomId);

      const createdNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          return {
            status: PROCESSING_RESULT.cancelled,
            notifications: []
          };
        }

        const reasons = notificationUtils.determineNotificationReasonsForRoomMessageCreatedEvent({
          event,
          room,
          notifiedUser: user
        });

        if (reasons.length) {
          createdNotifications.push(createNotificationForEvent({ event, user, reasons }));
        }
      }

      return {
        status: PROCESSING_RESULT.succeeded,
        notifications: createdNotifications
      };
    } finally {
      await userIterator.close();
    }
  }

  async _processDocumentInputCreatedEvent(event, context) {
    const userIterator = this.userStore.getActiveUsersIterator();

    try {
      const { documentInputId, documentId, roomId } = event.params;
      const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);
      const document = await this.documentStore.getDocumentById(documentId);
      const room = await this.roomStore.getRoomById(roomId);

      const createdNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          return {
            status: PROCESSING_RESULT.cancelled,
            notifications: []
          };
        }

        const reasons = notificationUtils.determineNotificationReasonsForDocumentInputCreatedEvent({
          event,
          documentInput,
          document,
          room,
          notifiedUser: user
        });

        if (reasons.length) {
          createdNotifications.push(createNotificationForEvent({ event, user, reasons }));
        }
      }

      return {
        status: PROCESSING_RESULT.succeeded,
        notifications: createdNotifications
      };
    } finally {
      await userIterator.close();
    }
  }

  async _processDocumentInputCommentCreatedEvent(event, context) {
    const userIterator = this.userStore.getActiveUsersIterator();

    try {
      const { documentInputId, documentId, roomId } = event.params;
      const documentInput = await this.documentInputStore.getDocumentInputById(documentInputId);
      const document = await this.documentStore.getDocumentById(documentId);
      const room = await this.roomStore.getRoomById(roomId);

      const createdNotifications = [];
      for await (const user of userIterator) {
        if (context.cancellationRequested) {
          return {
            status: PROCESSING_RESULT.cancelled,
            notifications: []
          };
        }

        const reasons = notificationUtils.determineNotificationReasonsForDocumentInputCommentCreatedEvent({
          event,
          documentInput,
          document,
          room,
          notifiedUser: user
        });

        if (reasons.length) {
          createdNotifications.push(createNotificationForEvent({ event, user, reasons }));
        }
      }

      return {
        status: PROCESSING_RESULT.succeeded,
        notifications: createdNotifications
      };
    } finally {
      await userIterator.close();
    }
  }

  async _processEvent(eventId, context) {
    let lock;
    try {
      lock = await this.lockStore.takeEventLock(eventId);
    } catch (err) {
      logger.debug(`Failed to take lock for event ${eventId}, will return`);
      return;
    }

    try {
      const event = await this.eventStore.getEventById(eventId);
      if (event.processedOn) {
        return;
      }

      logger.debug(`Processing event '${eventId}'`);

      let processingResult;
      try {
        switch (event.type) {
          case EVENT_TYPE.documentRevisionCreated:
            processingResult = await this._processDocumentRevisionCreatedEvent(event, context);
            break;
          case EVENT_TYPE.documentCommentCreated:
            processingResult = await this._processDocumentCommentCreatedEvent(event, context);
            break;
          case EVENT_TYPE.roomMessageCreated:
            processingResult = await this._processRoomMessageCreatedEvent(event, context);
            break;
          case EVENT_TYPE.documentInputCreated:
            processingResult = await this._processDocumentInputCreatedEvent(event, context);
            break;
          case EVENT_TYPE.documentInputCommentCreated:
            processingResult = await this._processDocumentInputCommentCreatedEvent(event, context);
            break;
          default:
            throw new Error(`Event type ${event.type} is unknown`);
        }
      } catch (err) {
        event.processingErrors.push(serializeError(err));
        processingResult = {
          status: PROCESSING_RESULT.failed,
          notifications: []
        };
      }

      const hasSuccessfullyFinished = processingResult.status === PROCESSING_RESULT.succeeded;
      const hasReachedMaxAttempts = event.processingErrors.length >= MAX_PROCESSING_ATTEMPTS;
      const shouldBeConsideredProcessed = hasSuccessfullyFinished || hasReachedMaxAttempts;
      event.processedOn = shouldBeConsideredProcessed ? new Date() : null;

      await this.transactionRunner.run(async session => {
        await this.eventStore.updateEvent(event, { session });
        if (processingResult.notifications.length) {
          await this.notificationStore.insertNotifications(processingResult.notifications, { session });
        }
      });
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async processNextEvent(context) {
    let eventId;

    try {
      eventId = await this.eventStore.getOldestUnprocessedEventId();
      if (!eventId) {
        logger.debug('No event to process, will return');
        return false;
      }

      if (!context.cancellationRequested) {
        await this._processEvent(eventId, context);
      }

      return true;
    } catch (error) {
      logger.error(`Error processing event '${eventId}': `, error);
      return false;
    }
  }
}

export default EventService;
