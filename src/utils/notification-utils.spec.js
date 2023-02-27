import { beforeEach, describe, expect, it } from 'vitest';
import { EVENT_TYPE, FAVORITE_TYPE, NOTIFICATION_REASON } from '../domain/constants.js';
import { determineNotificationReasonsForRevisionCreatedEvent, determineNotificationReasonsForCommentCreatedEvent } from './notification-utils.js';

describe('notification-utils', () => {

  describe('determineNotificationReasonsForRevisionCreatedEvent', () => {
    const testCases = [
      {
        description: 'when the notified user is the owner of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'owner-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user is an invited member of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user has marked the document as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite]
      },
      {
        description: 'when the notified user has marked the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document and the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite, NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the user has marked the document as favorite but the notified user is the same user as the event user',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'event-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the user is a room member or has marked the document or event user as favorite but the revision is in draft mode',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite but the event happened before the user has joined',
        event: { createdOn: new Date('2022-12-30'), type: EVENT_TYPE.revisionCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      }
    ];

    testCases.forEach(({ description, event, revision, document, room, notifiedUser, expectedReasons }) => {
      describe(description, () => {
        let result;
        beforeEach(() => {
          result = determineNotificationReasonsForRevisionCreatedEvent({ event, revision, document, room, notifiedUser });
        });
        it(`should return ${JSON.stringify(expectedReasons)}`, () => {
          expect(result).toStrictEqual(expectedReasons);
        });
      });
    });
  });

  describe('determineNotificationReasonsForCommentCreatedEvent', () => {
    const testCases = [
      {
        description: 'when the notified user is the owner of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'owner-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user is an invited member of the room',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: false } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [] },
        expectedReasons: [NOTIFICATION_REASON.roomMembership]
      },
      {
        description: 'when the notified user has marked the document as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite]
      },
      {
        description: 'when the notified user has marked the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the notified user has marked the document and the event user as favorite',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: [NOTIFICATION_REASON.documentFavorite, NOTIFICATION_REASON.userFavorite]
      },
      {
        description: 'when the user has marked the document as favorite but the notified user is the same user as the event user',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        revision: { _id: 'revision-id', documentId: 'document-id' },
        document: { _id: 'document-id' },
        room: null,
        notifiedUser: { _id: 'event-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the user is a room member or has marked the document or event user as favorite but the document is in draft mode',
        event: { createdOn: new Date('2023-01-01'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
        document: { _id: 'document-id', roomId: 'room-id', roomContext: { draft: true } },
        room: { _id: 'room-id', owner: 'owner-user-id', members: [{ userId: 'notified-user-id' }] },
        notifiedUser: { _id: 'notified-user-id', createdOn: new Date('2022-12-31'), favorites: [{ type: FAVORITE_TYPE.document, id: 'document-id' }, { type: FAVORITE_TYPE.user, id: 'event-user-id' }] },
        expectedReasons: []
      },
      {
        description: 'when the notified user has marked the document as favorite but the event happened before the user has joined',
        event: { createdOn: new Date('2022-12-30'), type: EVENT_TYPE.commentCreated, params: { userId: 'event-user-id' } },
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
          result = determineNotificationReasonsForCommentCreatedEvent({ event, document, room, notifiedUser });
        });
        it(`should return ${JSON.stringify(expectedReasons)}`, () => {
          expect(result).toStrictEqual(expectedReasons);
        });
      });
    });
  });

});
