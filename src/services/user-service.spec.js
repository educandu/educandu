import httpErrors from 'http-errors';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  setupTestUser,
  createTestRoom,
  createTestLesson,
  createTestDocument
} from '../test-helper.js';

const { NotFound } = httpErrors;

describe('user-service', () => {
  let db;
  let sut;
  let user;
  let password;
  let container;
  let executingUser;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    sut = container.get(UserService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    password = 'john-doe-12345$$$';
    user = await setupTestUser(container, { username: 'John Doe', email: 'john-doe@test.com', password });
    executingUser = await setupTestUser(container, { username: 'Emilia Watson', email: 'emilia-watson@test.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('authenticateUser', () => {
    let result;

    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: user.username, password, provider: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toBe(false);
      });
    });

    describe('when emailOrUsername doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: 'unknown', password });
      });
      it('should return null', () => {
        expect(result).toBe(false);
      });
    });

    describe('when password doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: user.email, password: 'wrong!' });
      });
      it('should return null', () => {
        expect(result).toBe(false);
      });
    });

    describe('when provider matches and emailOrUsername matches the email', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: user.email, password });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when provider matches and emailOrUsername matches the email in a different casing', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: user.email.toUpperCase(), password });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when provider matches and emailOrUsername matches the username', () => {
      beforeEach(async () => {
        result = await sut.authenticateUser({ emailOrUsername: user.username, password });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when provider matches and emailOrUsername matches the username and the email', () => {
      let user1;
      let user2;
      let result1;
      let result2;

      beforeEach(async () => {
        const password1 = 'abcde9475!!!';
        const password2 = 'owiem1002???';

        user1 = await setupTestUser(container, { username: 'peter', email: 'peter@peterson.com', password: password1 });
        user2 = await setupTestUser(container, { username: 'peter@peterson.com', email: 'different-peter@peterson.com', password: password2 });
        result1 = await sut.authenticateUser({ emailOrUsername: 'peter@peterson.com', password: password1 });
        result2 = await sut.authenticateUser({ emailOrUsername: 'different-peter@peterson.com', password: password2 });
      });
      it('should return the user where the email matches', () => {
        expect(result1).toEqual(user1);
      });
      it('should still find the other user by email', () => {
        expect(result2).toEqual(user2);
      });
    });
  });

  describe('updateUserStoragePlan', () => {
    let storagePlan;

    beforeEach(async () => {
      storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 500 * 1000 * 1000 };
      await db.storagePlans.insertOne(storagePlan);
    });

    describe('when called with the ID of a non-existent user', () => {
      it('should throw a not found error', () => {
        expect(() => sut.updateUserStoragePlan('non-existent-user-id', storagePlan._id)).rejects.toThrowError(NotFound);
      });
    });
    describe('when called with the ID of a non-existent storage plan', () => {
      it('should throw a not found error', () => {
        expect(() => sut.updateUserStoragePlan(user._id, 'non-existent-user-id')).rejects.toThrowError(NotFound);
      });
    });
    describe('when called with the ID of a user that has already an assigned plan', () => {
      let result;
      beforeEach(async () => {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { plan: 'some-other-plan-id', usedBytes: 0, reminders: [] } } }
        );
        result = await sut.updateUserStoragePlan(user._id, storagePlan._id);
      });
      it('should assign the new plan', () => {
        expect(result.plan).toBe(storagePlan._id);
      });
    });
    describe('when called with the ID of a user that has no plan assigned yet', () => {
      let result;
      beforeEach(async () => {
        result = await sut.updateUserStoragePlan(user._id, storagePlan._id);
      });
      it('should assign the new plan', () => {
        expect(result.plan).toBe(storagePlan._id);
      });
    });
    describe('when called with a storage plan ID of `null`', () => {
      let result;
      beforeEach(async () => {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { plan: 'some-other-plan-id', usedBytes: 250, reminders: [{ timestamp: new Date(), createdBy: executingUser._id }] } } }
        );
        result = await sut.updateUserStoragePlan(user._id, null);
      });
      it('should set the plan on the user to `null`', () => {
        expect(result.plan).toBeNull();
      });
      it('should not change the existing used bytes', () => {
        expect(result.usedBytes).toBe(250);
      });
      it('should not change the existing reminders', () => {
        expect(result.reminders).toHaveLength(1);
      });
    });
  });

  describe('addUserStorageReminder', () => {
    describe('when called with the ID of a non-existent user', () => {
      it('should throw a not found error', () => {
        expect(() => sut.addUserStorageReminder('non-existent-user-id', executingUser._id)).rejects.toThrowError(NotFound);
      });
    });
    describe('when called with the ID of a user that has no storage assigned yet', () => {
      let result;
      beforeEach(async () => {
        result = await sut.addUserStorageReminder(user._id, executingUser._id);
      });
      it('should create a new default storage and add the reminder', () => {
        expect(result.reminders).toHaveLength(1);
      });
    });
    describe('when called with the ID of a user that has already a reminder', () => {
      let result;
      beforeEach(async () => {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { plan: 'some-other-plan-id', usedBytes: 0, reminders: [{ timestamp: new Date(), createdBy: executingUser._id }] } } }
        );
        result = await sut.addUserStorageReminder(user._id, executingUser._id);
      });
      it('should append a new reminder', () => {
        expect(result.reminders).toHaveLength(2);
      });
    });
  });

  describe('deleteAllUserStorageReminders', () => {
    let storagePlan;

    beforeEach(async () => {
      storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 500 * 1000 * 1000 };
      await db.storagePlans.insertOne(storagePlan);
    });

    describe('when called with the ID of a non-existent user', () => {
      it('should throw a not found error', () => {
        expect(() => sut.deleteAllUserStorageReminders('non-existent-user-id', storagePlan._id)).rejects.toThrowError(NotFound);
      });
    });
    describe('when called with the ID of a user that has no storage assigned yet', () => {
      let result;
      beforeEach(async () => {
        result = await sut.deleteAllUserStorageReminders(user._id, storagePlan._id);
      });
      it('should create a new default storage with an empty reminder array', () => {
        expect(result.reminders).toHaveLength(0);
      });
    });
    describe('when called with the ID of a user that has reminders', () => {
      let result;
      beforeEach(async () => {
        const existingReminders = [
          { timestamp: new Date(), createdBy: executingUser._id },
          { timestamp: new Date(), createdBy: executingUser._id },
          { timestamp: new Date(), createdBy: executingUser._id }
        ];
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { plan: 'some-other-plan-id', usedBytes: 0, reminders: existingReminders } } }
        );
        result = await sut.deleteAllUserStorageReminders(user._id, storagePlan._id);
      });
      it('should replace them with an empty array', () => {
        expect(result.reminders).toHaveLength(0);
      });
    });
  });

  describe('getFavorites', () => {
    let result;

    describe('when there are no favorites', () => {
      beforeEach(async () => {
        result = await sut.getFavorites({ user });
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are favorites', () => {
      let document;
      let room;
      let lesson;

      beforeEach(async () => {
        room = await createTestRoom(container, { name: 'Favorite room' });
        lesson = await createTestLesson(container, { title: 'Favorite lesson' });
        document = await createTestDocument(container, user, { title: 'Favorite document' });

        const favorites = [
          {
            type: FAVORITE_TYPE.room,
            setOn: new Date('2022-03-09T10:01:00.000Z'),
            id: room._id
          },
          {
            type: FAVORITE_TYPE.lesson,
            setOn: new Date('2022-03-09T10:02:00.000Z'),
            id: lesson._id
          },
          {
            type: FAVORITE_TYPE.document,
            setOn: new Date('2022-03-09T10:03:00.000Z'),
            id: document._id
          }
        ];

        result = await sut.getFavorites({ user: { ...user, favorites } });
      });

      it('should return an array containing the user favorites', () => {
        expect(result).toEqual([
          {
            id: room._id,
            type: FAVORITE_TYPE.room,
            setOn: new Date('2022-03-09T10:01:00.000Z'),
            title: 'Favorite room'
          },
          {
            id: lesson._id,
            type: FAVORITE_TYPE.lesson,
            setOn: new Date('2022-03-09T10:02:00.000Z'),
            title: 'Favorite lesson'
          },
          {
            id: document._id,
            type: FAVORITE_TYPE.document,
            setOn: new Date('2022-03-09T10:03:00.000Z'),
            title: 'Favorite document'
          }
        ]);
      });
    });
  });

  describe('addFavorite', () => {
    let result;

    beforeEach(async () => {
      result = await sut.addFavorite({ type: FAVORITE_TYPE.lesson, id: '9c348ntxgnr9xy', user: executingUser });
    });

    it('should add a new entry to the user\'s favorite collection', () => {
      expect(result.favorites).toStrictEqual([{ type: FAVORITE_TYPE.lesson, id: '9c348ntxgnr9xy', setOn: expect.any(Date) }]);
    });
  });

  describe('deleteFavorite', () => {
    let result;

    beforeEach(async () => {
      await db.users.updateOne({ _id: executingUser._id }, {
        $set: {
          favorites: [
            { type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: new Date() },
            { type: FAVORITE_TYPE.lesson, id: 'm9vc9qmhc9qcwas', setOn: new Date() }
          ]
        }
      });

      result = await sut.deleteFavorite({ type: FAVORITE_TYPE.lesson, id: 'm9vc9qmhc9qcwas', user: executingUser });
    });

    it('should remove the matching entries from the user\'s favorite collection', () => {
      expect(result.favorites).toStrictEqual([{ type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: expect.any(Date) }]);
    });
  });

});
