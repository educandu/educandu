import notificationUtils from './notification-utils.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { EVENT_TYPE, FAVORITE_TYPE, NOTIFICATION_REASON } from '../domain/constants.js';

describe('notification-utils', () => {

  describe('determineNotificationReasonsForDocumentRevisionCreatedEvent', () => {
    const testCases = [
      {
        description: 'when the notified user is the owner of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'owner-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user is an invited member of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user has marked the room as favorite but the room and its documents have been deleted in the meantime',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: null,
        document: null,
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite]
      },
      {
        description: 'when the notified user has marked the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document and the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite, NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document as favorite but the notified user is the same user as the event user',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'event-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user is a room member or has marked the document or event user as favorite but the revision is in draft mode',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite but the event happened before the user has joined',
        event: { createdOn: new Date('2022-12-30'), type: EVENT_TYPE.documentRevisionCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      }
    ];

    testCases.forEach(({ description, event, documentRevision, document, room, notifiedUser, expectedReasons }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = notificationUtils.determineNotificationReasonsForDocumentRevisionCreatedEvent({ event, documentRevision, document, room, notifiedUser });
        });
        it(`should return ${JSON.stringify(expectedReasons)}`, () => {
          expect(result).toStrictEqual(expectedReasons);
        });
      });
    });
  });

  describe('determineNotificationReasonsForDocumentCommentCreatedEvent', () => {
    const testCases = [
      {
        description: 'when the notified user is an invited member of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user has marked the room as favorite but the room and its documents have been deleted in the meantime',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: null,
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite]
      },
      {
        description: 'when the notified user has marked the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document and the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite, NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document as favorite but the notified user is the same user as the event user',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        documentRevision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'event-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user is a room member or has marked the document or event user as favorite but the document is in draft mode',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite but the event happened before the user has joined',
        event: { createdOn: new Date('2022-12-30'), type: EVENT_TYPE.documentCommentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      }
    ];

    testCases.forEach(({ description, event, document, room, notifiedUser, expectedReasons }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = notificationUtils.determineNotificationReasonsForDocumentCommentCreatedEvent({ event, document, room, notifiedUser });
        });
        it(`should return ${JSON.stringify(expectedReasons)}`, () => {
          expect(result).toStrictEqual(expectedReasons);
        });
      });
    });
  });

  describe('determineNotificationReasonsForRoomMessageCreatedEvent', () => {
    const testCases = [
      {
        description: 'when the notified user is the owner of the room (meaning the same user as the event user)',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.roomMessageCreated, params: { userId: 'owner-user-id', roomMessageKey: 'key' } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }], messages: [{ key: 'key' }] },
        notifiedUser: { _id: 'owner-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: []
      },
      {
        description: 'when the notified user is an invited member of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.roomMessageCreated, params: { userId: 'event-user-id', roomMessageKey: 'key' } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }], messages: [{ key: 'key' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user is an invited member of the room but the room has been deleted in the meantime',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.roomMessageCreated, params: { userId: 'event-user-id', roomMessageKey: 'key' } },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: []
      },
      {
        description: 'when the notified user is an invited member of the room but the room message has been deleted in the meantime',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.roomMessageCreated, params: { userId: 'event-user-id', roomMessageKey: 'key' } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }], messages: [] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: []
      },
      {
        description: 'when the notified user is an invited member of the room and has marked the room as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.roomMessageCreated, params: { userId: 'event-user-id', roomMessageKey: 'key' } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }], messages: [{ key: 'key' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.room, id: 'room-id' }] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership, NOTIFICATION_REASON.roomFavorite]
      }
    ];

    testCases.forEach(({ description, event, document, room, notifiedUser, expectedReasons }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = notificationUtils.determineNotificationReasonsForRoomMessageCreatedEvent({ event, document, room, notifiedUser });
        });
        it(`should return ${JSON.stringify(expectedReasons)}`, () => {
          expect(result).toStrictEqual(expectedReasons);
        });
      });
    });
  });

  describe('groupNotifications', () => {
    let result;
    let notifications;

    describe('when all notifications are considered distinct', () => {
      beforeEach(() => {
        notifications = [
          { _id: 'notification-1', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-1' }, createdOn: new Date('2023-02-28T12:01:00Z') },
          { _id: 'notification-2', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:02:00Z') },
          { _id: 'notification-3', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-3' }, createdOn: new Date('2023-02-28T12:03:00Z') }
        ];

        result = notificationUtils.groupNotifications(notifications);
      });

      it('should create a new group for each notification', () => {
        expect(result).toStrictEqual([
          {
            notificationIds: ['notification-1'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-1' },
            firstCreatedOn: new Date('2023-02-28T12:01:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:01:00Z')
          },
          {
            notificationIds: ['notification-2'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-2' },
            firstCreatedOn: new Date('2023-02-28T12:02:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:02:00Z')
          },
          {
            notificationIds: ['notification-3'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-3' },
            firstCreatedOn: new Date('2023-02-28T12:03:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:03:00Z')
          }
        ]);
      });
    });

    describe('when there are contiguous notifications of the same type relating to the same document', () => {
      beforeEach(() => {
        notifications = [
          { _id: 'notification-1', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-1' }, createdOn: new Date('2023-02-28T12:01:00Z') },
          { _id: 'notification-2', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:02:00Z') },
          { _id: 'notification-3', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:03:00Z') },
          { _id: 'notification-4', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-3' }, createdOn: new Date('2023-02-28T12:04:00Z') }
        ];

        result = notificationUtils.groupNotifications(notifications);
      });

      it('should group these notifications together', () => {
        expect(result).toStrictEqual([
          {
            notificationIds: ['notification-1'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-1' },
            firstCreatedOn: new Date('2023-02-28T12:01:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:01:00Z')
          },
          {
            notificationIds: ['notification-2', 'notification-3'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-2' },
            firstCreatedOn: new Date('2023-02-28T12:02:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:03:00Z')
          },
          {
            notificationIds: ['notification-4'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-3' },
            firstCreatedOn: new Date('2023-02-28T12:04:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:04:00Z')
          }
        ]);
      });
    });

    describe('when a series of notifications of the same type relating to the same document is interrupted by a different type', () => {
      beforeEach(() => {
        notifications = [
          { _id: 'notification-1', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-1' }, createdOn: new Date('2023-02-28T12:01:00Z') },
          { _id: 'notification-2', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:02:00Z') },
          { _id: 'notification-3', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:03:00Z') },
          { _id: 'notification-4', eventType: EVENT_TYPE.documentCommentCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:04:00Z') },
          { _id: 'notification-5', eventType: EVENT_TYPE.documentRevisionCreated, eventParams: { documentId: 'document-2' }, createdOn: new Date('2023-02-28T12:05:00Z') }
        ];

        result = notificationUtils.groupNotifications(notifications);
      });

      it('should start a new group each time', () => {
        expect(result).toStrictEqual([
          {
            notificationIds: ['notification-1'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-1' },
            firstCreatedOn: new Date('2023-02-28T12:01:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:01:00Z')
          },
          {
            notificationIds: ['notification-2', 'notification-3'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-2' },
            firstCreatedOn: new Date('2023-02-28T12:02:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:03:00Z')
          },
          {
            notificationIds: ['notification-4'],
            eventType: EVENT_TYPE.documentCommentCreated,
            eventParams: { documentId: 'document-2' },
            firstCreatedOn: new Date('2023-02-28T12:04:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:04:00Z')
          },
          {
            notificationIds: ['notification-5'],
            eventType: EVENT_TYPE.documentRevisionCreated,
            eventParams: { documentId: 'document-2' },
            firstCreatedOn: new Date('2023-02-28T12:05:00Z'),
            lastCreatedOn: new Date('2023-02-28T12:05:00Z')
          }
        ]);
      });
    });
  });

});
