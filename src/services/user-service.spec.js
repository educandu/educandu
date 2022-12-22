import httpErrors from 'http-errors';
import { createSandbox } from 'sinon';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  setupTestUser,
  createTestRoom,
  createTestDocument,
  updateTestUser
} from '../test-helper.js';

const { NotFound } = httpErrors;

describe('user-service', () => {
  let db;
  let sut;
  let user;
  let password;
  let container;
  let executingUser;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    sut = container.get(UserService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    password = 'john-doe-12345$$$';
    user = await setupTestUser(container, { email: 'john-doe@test.com', password, displayName: 'John Doe' });
    executingUser = await setupTestUser(container, { email: 'emilia-watson@test.com', displayName: 'Emilia Watson' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('findConfirmedActiveUserByEmailAndPassword', () => {
    let result;

    describe('when email doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: 'unknown', password });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when password doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password: 'wrong!' });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when email matches', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when email matches in a different casing', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email.toUpperCase(), password });
      });
      it('should still return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when email and password match but the account is closed', () => {
      beforeEach(async () => {
        user.accountClosedOn = new Date('2022-12-01T12:00:00.000Z');
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when email and password match but the user account is locked', () => {
      beforeEach(async () => {
        user.accountLockedOn = new Date();
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password });
      });
      it('should still return the user', () => {
        expect(result).toEqual(user);
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
          { $set: { storage: { planId: 'some-other-plan-id', usedBytes: 0, reminders: [] } } }
        );
        result = await sut.updateUserStoragePlan(user._id, storagePlan._id);
      });
      it('should assign the new plan', () => {
        expect(result.planId).toBe(storagePlan._id);
      });
    });
    describe('when called with the ID of a user that has no plan assigned yet', () => {
      let result;
      beforeEach(async () => {
        result = await sut.updateUserStoragePlan(user._id, storagePlan._id);
      });
      it('should assign the new plan', () => {
        expect(result.planId).toBe(storagePlan._id);
      });
    });
    describe('when called with a storage plan ID of `null`', () => {
      let result;
      beforeEach(async () => {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { planId: 'some-other-plan-id', usedBytes: 250, reminders: [{ timestamp: new Date(), createdBy: executingUser._id }] } } }
        );
        result = await sut.updateUserStoragePlan(user._id, null);
      });
      it('should set the plan on the user to `null`', () => {
        expect(result.planId).toBeNull();
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
        expect(() => sut.addUserStorageReminder('non-existent-user-id', executingUser)).rejects.toThrowError(NotFound);
      });
    });
    describe('when called with the ID of a user that has no storage assigned yet', () => {
      let result;
      beforeEach(async () => {
        result = await sut.addUserStorageReminder(user._id, executingUser);
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
          { $set: { storage: { planId: 'some-other-plan-id', usedBytes: 0, reminders: [{ timestamp: new Date(), createdBy: executingUser._id }] } } }
        );
        result = await sut.addUserStorageReminder(user._id, executingUser);
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
          { $set: { storage: { planId: 'some-other-plan-id', usedBytes: 0, reminders: existingReminders } } }
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
      let favoriteDocumentMetadata;
      let favoriteRoom;
      let favoriteUser;

      beforeEach(async () => {
        const favoriteDocument = await createTestDocument(container, user, { title: 'Favorite document', createdBy: user._id });
        favoriteDocumentMetadata = {
          _id: favoriteDocument._id,
          slug: favoriteDocument.slug,
          title: favoriteDocument.title,
          language: favoriteDocument.language,
          createdOn: favoriteDocument.createdOn,
          updatedOn: favoriteDocument.updatedOn,
          revision: favoriteDocument.revision,
          roomId: favoriteDocument.roomId
        };
        favoriteRoom = await createTestRoom(container, { name: 'Favorite room', owner: user._id, createdBy: user._id });
        favoriteUser = await setupTestUser(container, { displayName: 'Favorite user', email: 'favorite-user@test.com' });

        const favorites = [
          {
            type: FAVORITE_TYPE.room,
            setOn: new Date('2022-03-09T10:01:00.000Z'),
            id: favoriteRoom._id
          },
          {
            type: FAVORITE_TYPE.document,
            setOn: new Date('2022-03-09T10:03:00.000Z'),
            id: favoriteDocument._id
          },
          {
            type: FAVORITE_TYPE.user,
            setOn: new Date('2022-03-09T10:05:00.000Z'),
            id: favoriteUser._id
          }
        ];

        result = await sut.getFavorites({ user: { ...user, favorites } });
      });

      it('should return an array containing the user favorites', () => {
        expect(result).toEqual([
          {
            id: favoriteRoom._id,
            type: FAVORITE_TYPE.room,
            setOn: new Date('2022-03-09T10:01:00.000Z'),
            data: {
              ...favoriteRoom
            }
          },
          {
            id: favoriteDocumentMetadata._id,
            type: FAVORITE_TYPE.document,
            setOn: new Date('2022-03-09T10:03:00.000Z'),
            data: {
              ...favoriteDocumentMetadata
            }
          },
          {
            id: favoriteUser._id,
            type: FAVORITE_TYPE.user,
            setOn: new Date('2022-03-09T10:05:00.000Z'),
            data: {
              ...favoriteUser
            }
          }
        ]);
      });
    });
  });

  describe('addFavorite', () => {
    let result;

    beforeEach(async () => {
      result = await sut.addFavorite({ type: FAVORITE_TYPE.document, id: '9c348ntxgnr9xyz', user: executingUser });
    });

    it('should add a new entry to the user\'s favorite collection', () => {
      expect(result.favorites).toStrictEqual([{ type: FAVORITE_TYPE.document, id: '9c348ntxgnr9xyz', setOn: expect.any(Date) }]);
    });
  });

  describe('deleteFavorite', () => {
    let result;

    beforeEach(async () => {
      await db.users.updateOne({ _id: executingUser._id }, {
        $set: {
          favorites: [
            { type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: new Date() },
            { type: FAVORITE_TYPE.document, id: 'm9vc9qmhc9qcwas', setOn: new Date() }
          ]
        }
      });

      result = await sut.deleteFavorite({ type: FAVORITE_TYPE.document, id: 'm9vc9qmhc9qcwas', user: executingUser });
    });

    it('should remove the matching entries from the user\'s favorite collection', () => {
      expect(result.favorites).toStrictEqual([{ type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: expect.any(Date) }]);
    });
  });

});
