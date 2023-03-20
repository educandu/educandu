import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { assert, createSandbox } from 'sinon';
import EventService from './event-service.js';
import LockStore from '../stores/lock-store.js';
import EventStore from '../stores/event-store.js';
import notificationUtils from '../utils/notification-utils.js';
import { EVENT_TYPE, NOTIFICATION_REASON } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser,
  createTestRoom
} from '../test-helper.js';

describe('event-service', () => {
  let db;
  let sut;
  let myRoom;
  let myUser;
  let result;
  let context;
  let otherUser;
  let container;
  let lockStore;
  let eventStore;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    lockStore = container.get(LockStore);
    eventStore = container.get(EventStore);

    sut = container.get(EventService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    sandbox.stub(lockStore, 'takeEventLock');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(notificationUtils, 'determineNotificationReasonsForRoomMessageCreatedEvent');

    myUser = await createTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
    myRoom = await createTestRoom(container, { owner: myUser._id, createdBy: myUser._id });
    otherUser = await createTestUser(container, { email: 'goofy@ducktown.com', displayName: 'Goofy' });
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('processNextEvent', () => {
    let message;
    const lock = { key: 'event' };

    describe('when there is no event to process', () => {
      beforeEach(async () => {
        context = { cancellationRequested: false };
        result = await sut.processNextEvent(context);
      });

      it('should not create any notification', async () => {
        const notification = await db.notifications.findOne({});
        expect(notification).toBe(null);
      });

      it('should return false', () => {
        expect(result).toEqual(false);
      });
    });

    describe('when there is an event to process but cancellationRequested is true', () => {
      beforeEach(async () => {
        context = { cancellationRequested: true };
        message = { key: uniqueId.create() };

        lockStore.takeEventLock.resolves(lock);
        lockStore.releaseLock.resolves();

        await eventStore.recordRoomMessageCreatedEvent({ userId: myUser._id, roomId: myRoom._id, roomMessageKey: message.key });

        result = await sut.processNextEvent(context);
      });

      it('should not take a lock on the event', () => {
        assert.notCalled(lockStore.takeEventLock);
      });

      it('should not create any notification', async () => {
        const notification = await db.notifications.findOne({});
        expect(notification).toBe(null);
      });

      it('should return true', () => {
        expect(result).toEqual(true);
      });
    });

    describe('when there is a room message created event to process', () => {
      let event;

      describe('and there no reasons to notify users', () => {
        beforeEach(async () => {
          context = { cancellationRequested: false };
          message = { key: uniqueId.create() };

          lockStore.takeEventLock.resolves(lock);
          lockStore.releaseLock.resolves();

          event = await eventStore.recordRoomMessageCreatedEvent({ userId: myUser._id, roomId: myRoom._id, roomMessageKey: message.key });

          notificationUtils.determineNotificationReasonsForRoomMessageCreatedEvent.returns([]);

          result = await sut.processNextEvent(context);
        });

        it('should take a lock on the event', () => {
          assert.calledWith(lockStore.takeEventLock, event._id);
        });

        it('should release the lock on the event', () => {
          assert.calledWith(lockStore.releaseLock, lock);
        });

        it('should not create any notification', async () => {
          const notification = await db.notifications.findOne({});
          expect(notification).toBe(null);
        });

        it('should return true', () => {
          expect(result).toEqual(true);
        });
      });

      describe('and there is a reason to notify a user', () => {
        beforeEach(async () => {
          context = { cancellationRequested: false };
          message = { key: uniqueId.create() };

          lockStore.takeEventLock.resolves(lock);
          lockStore.releaseLock.resolves();

          event = await eventStore.recordRoomMessageCreatedEvent({ userId: myUser._id, roomId: myRoom._id, roomMessageKey: message.key });

          notificationUtils.determineNotificationReasonsForRoomMessageCreatedEvent
            .returns([]);
          notificationUtils.determineNotificationReasonsForRoomMessageCreatedEvent
            .withArgs({ event, room: myRoom, notifiedUser: otherUser })
            .returns([NOTIFICATION_REASON.roomMembership]);

          result = await sut.processNextEvent(context);
        });

        it('should take a lock on the event', () => {
          assert.calledWith(lockStore.takeEventLock, event._id);
        });

        it('should release the lock on the event', () => {
          assert.calledWith(lockStore.releaseLock, lock);
        });

        it('should create a notification', async () => {
          const notification = await db.notifications.findOne({});
          const expiresOn = new Date();
          expiresOn.setMonth(expiresOn.getMonth() + 2);

          expect(notification).toStrictEqual({
            _id: expect.stringMatching(/\w+/),
            createdOn: now,
            eventId: event._id,
            eventParams: {
              roomId: myRoom._id,
              roomMessageKey: message.key,
              userId: myUser._id
            },
            eventType: EVENT_TYPE.roomMessageCreated,
            expiresOn,
            notifiedUserId: otherUser._id,
            reasons: [NOTIFICATION_REASON.roomMembership]
          });
        });

        it('should return true', () => {
          expect(result).toEqual(true);
        });
      });
    });
  });
});
