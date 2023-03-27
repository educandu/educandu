import httpErrors from 'http-errors';
import { createSandbox } from 'sinon';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  EMAIL_NOTIFICATION_FREQUENCY,
  ERROR_CODES,
  FAVORITE_TYPE,
  ROLE,
  USER_ACTIVITY_TYPE
} from '../domain/constants.js';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser,
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
    user = await createTestUser(container, { email: 'john-doe@test.com', password, displayName: 'John Doe' });
    executingUser = await createTestUser(container, { email: 'emilia-watson@test.com', displayName: 'Emilia Watson' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getActiveUsersBySearch', () => {
    let result;

    beforeEach(async () => {
      await Promise.all([
        createTestUser(container, { displayName: 'test-user-abc', password: '1234qwer', email: 'email1@test.com' }),
        createTestUser(container, { displayName: 'test-user', password: '1234qwer', email: 'abc@test.com' }),
        createTestUser(container, { displayName: 'abc', password: '1234qwer', email: 'email3@test.com' })
      ]);

      result = await sut.getActiveUsersBySearch({ query: 'abc' });
    });

    it('returns the users ordered by relevance', () => {
      expect(result).toMatchObject([
        { displayName: 'abc', email: 'email3@test.com' },
        { displayName: 'test-user', email: 'abc@test.com' },
        { displayName: 'test-user-abc', email: 'email1@test.com' }
      ]);
    });
  });

  describe('findConfirmedActiveUserById', () => {
    let result;

    describe('when userId doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserById({ userId: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when userId matches', () => {
      beforeEach(async () => {
        result = await sut.findConfirmedActiveUserById({ userId: user._id });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when userId matches but the account is not yet confirmed', () => {
      beforeEach(async () => {
        user.expiresOn = new Date();
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserById({ userId: user._id });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when userId matches but the account is closed', () => {
      beforeEach(async () => {
        user.accountClosedOn = new Date();
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserById({ userId: user._id });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when userId matches but the user account is locked', () => {
      let thrownError;

      beforeEach(async () => {
        user.accountLockedOn = new Date();
        await updateTestUser(container, user);
      });

      describe('and throwIfLocked is `false`', () => {
        beforeEach(async () => {
          try {
            result = await sut.findConfirmedActiveUserById({ userId: user._id, throwIfLocked: false });
            thrownError = null;
          } catch (error) {
            result = null;
            thrownError = error;
          }
        });
        it('should still return the user', () => {
          expect(result).toEqual(user);
        });
      });

      describe('and throwIfLocked is `true`', () => {
        beforeEach(async () => {
          try {
            result = await sut.findConfirmedActiveUserById({ userId: user._id, throwIfLocked: true });
            thrownError = null;
          } catch (error) {
            result = null;
            thrownError = error;
          }
        });
        it('should throw an error with the correct error code', () => {
          expect(thrownError).toEqual(expect.objectContaining({ code: ERROR_CODES.userAccountLocked }));
        });
      });
    });
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

    describe('when email and password match but the account is not yet confirmed', () => {
      beforeEach(async () => {
        user.expiresOn = new Date();
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when email and password match but the account is closed', () => {
      beforeEach(async () => {
        user.accountClosedOn = new Date();
        await updateTestUser(container, user);
        result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password });
      });
      it('should return null', () => {
        expect(result).toBe(null);
      });
    });

    describe('when email and password match but the user account is locked', () => {
      let thrownError;

      describe('and throwIfLocked is `false`', () => {
        beforeEach(async () => {
          user.accountLockedOn = new Date();
          await updateTestUser(container, user);
          try {
            result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password, throwIfLocked: false });
            thrownError = null;
          } catch (error) {
            result = null;
            thrownError = error;
          }
        });
        it('should still return the user', () => {
          expect(result).toEqual(user);
        });
      });

      describe('and throwIfLocked is `true`', () => {
        beforeEach(async () => {
          user.accountLockedOn = new Date();
          await updateTestUser(container, user);
          try {
            result = await sut.findConfirmedActiveUserByEmailAndPassword({ email: user.email, password, throwIfLocked: true });
            thrownError = null;
          } catch (error) {
            result = null;
            thrownError = error;
          }
        });
        it('should throw an error with the correct error code', () => {
          expect(thrownError).toEqual(expect.objectContaining({ code: ERROR_CODES.userAccountLocked }));
        });
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
          order: favoriteDocument.order,
          slug: favoriteDocument.slug,
          title: favoriteDocument.title,
          language: favoriteDocument.language,
          description: favoriteDocument.description,
          createdBy: favoriteDocument.createdBy,
          createdOn: favoriteDocument.createdOn,
          updatedOn: favoriteDocument.updatedOn,
          updatedBy: favoriteDocument.updatedBy,
          revision: favoriteDocument.revision,
          roomId: favoriteDocument.roomId,
          tags: favoriteDocument.tags,
          contributors: favoriteDocument.contributors,
          publicContext: favoriteDocument.publicContext
        };
        favoriteRoom = await createTestRoom(container, { name: 'Favorite room', owner: user._id, createdBy: user._id });
        favoriteUser = await createTestUser(container, { displayName: 'Favorite user', email: 'favorite-user@test.com' });

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

  describe('getActivities', () => {
    let result;
    let otherUser;

    beforeEach(async () => {
      otherUser = await createTestUser(container, { email: 'other@test.com', displayName: 'Other user' });
    });

    describe('when there are no activities', () => {
      beforeEach(async () => {
        result = await sut.getActivities({ userId: user._id });
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are activities', () => {
      let joinedRoom;
      let createdRoom;
      let favoriteRoom;
      let favoriteUser;
      let createdDocument;
      let updatedDocument;
      let favoriteDocument;
      let allUserActivities;

      beforeEach(async () => {
        createdDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document' });
        await db.documents.updateOne({ _id: createdDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:00:00.000Z')
          }
        });

        updatedDocument = await createTestDocument(container, otherUser, { title: 'Created document [other]' });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            updatedBy: user._id,
            title: 'Updated document',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });

        createdRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room',
          createdOn: new Date('2022-03-09T10:03:00.000Z'),
          updatedOn: new Date('2022-03-09T10:03:00.000Z'),
          members: [{ userId: otherUser._id, joinedOn: new Date('2022-03-09T10:04:00.000Z') }]
        });
        await db.rooms.updateOne({ _id: createdRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Updated room',
            createdOn: new Date('2022-03-09T10:03:00.000Z'),
            updatedOn: new Date('2022-03-09T10:05:00.000Z')
          }
        });

        joinedRoom = await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Created room [other]',
          createdOn: new Date('2022-03-09T10:06:00.000Z'),
          updatedOn: new Date('2022-03-09T10:06:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:07:00.000Z') }]
        });

        favoriteRoom = await createTestRoom(container, { name: 'Created popular room [other]', owner: otherUser._id, createdBy: otherUser._id });
        favoriteDocument = await createTestDocument(container, otherUser, { title: 'Created popular document [other]' });
        favoriteUser = await createTestUser(container, { displayName: 'Popular user', email: 'popular-user@test.com' });
        await db.users.updateOne({ _id: user._id }, {
          $set: {
            favorites: [
              {
                type: FAVORITE_TYPE.room,
                setOn: new Date('2022-03-09T10:11:00.000Z'),
                id: favoriteRoom._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:13:00.000Z'),
                id: favoriteDocument._id
              },
              {
                type: FAVORITE_TYPE.user,
                setOn: new Date('2022-03-09T10:15:00.000Z'),
                id: favoriteUser._id
              }
            ]
          }
        });

        allUserActivities = [
          {
            type: USER_ACTIVITY_TYPE.userMarkedFavorite,
            timestamp: new Date('2022-03-09T10:15:00.000Z'),
            isDeprecated: false,
            data: {
              _id: favoriteUser._id,
              displayName: 'Popular user'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: new Date('2022-03-09T10:13:00.000Z'),
            isDeprecated: false,
            data: {
              _id: favoriteDocument._id,
              title: 'Created popular document [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomMarkedFavorite,
            timestamp: new Date('2022-03-09T10:11:00.000Z'),
            isDeprecated: false,
            data: {
              _id: favoriteRoom._id,
              name: 'Created popular room [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomJoined,
            timestamp: new Date('2022-03-09T10:07:00.000Z'),
            isDeprecated: false,
            data: {
              _id: joinedRoom._id,
              name: 'Created room [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomUpdated,
            timestamp: new Date('2022-03-09T10:05:00.000Z'),
            isDeprecated: false,
            data: {
              _id: createdRoom._id,
              name: 'Updated room'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomCreated,
            timestamp: new Date('2022-03-09T10:03:00.000Z'),
            isDeprecated: false,
            data: {
              _id: createdRoom._id,
              name: 'Updated room'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.documentUpdated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            isDeprecated: false,
            data: {
              _id: updatedDocument._id,
              title: 'Updated document'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.documentCreated,
            timestamp: new Date('2022-03-09T10:00:00.000Z'),
            isDeprecated: false,
            data: {
              _id: createdDocument._id,
              title: 'Created document'
            }
          }
        ];
      });

      describe('and limit is not set', () => {
        beforeEach(async () => {
          result = await sut.getActivities({ userId: user._id });
        });

        it('should return all activities sorted descending', () => {
          expect(result).toEqual(allUserActivities);
        });
      });

      describe('and limit is set to 5', () => {
        beforeEach(async () => {
          result = await sut.getActivities({ userId: user._id, limit: 5 });
        });

        it('should return latest 5 activities sorted descending', () => {
          expect(result).toEqual(allUserActivities.splice(0, 5));
        });
      });
    });

    describe('when there are more \'document-created\' activities than the set limit', () => {
      let latestCreatedDocument;

      beforeEach(async () => {
        const firstCreatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document 1' });
        await db.documents.updateOne({ _id: firstCreatedDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:00:00.000Z')
          }
        });
        latestCreatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document 2' });
        await db.documents.updateOne({ _id: latestCreatedDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:01:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created documents', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentCreated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            isDeprecated: false,
            data: {
              _id: latestCreatedDocument._id,
              title: 'Created document 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'document-updated\' activities than the set limit', () => {
      let updatedDocument;

      beforeEach(async () => {
        updatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document' });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            title: 'Document update 1',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            title: 'Document update 2',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:02:00.000Z')
          }
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest updated documents', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentUpdated,
            timestamp: new Date('2022-03-09T10:02:00.000Z'),
            isDeprecated: false,
            data: {
              _id: updatedDocument._id,
              title: 'Document update 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-created\' activities than the set limit', () => {
      let latestCreatedRoom;

      beforeEach(async () => {
        await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 1',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        latestCreatedRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 2',
          createdOn: new Date('2022-03-09T10:01:00.000Z'),
          updatedOn: new Date('2022-03-09T10:01:00.000Z')
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomCreated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            isDeprecated: false,
            data: {
              _id: latestCreatedRoom._id,
              name: 'Created room 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-updated\' activities than the set limit', () => {
      let updatedRoom;

      beforeEach(async () => {
        updatedRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 1',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        await db.rooms.updateOne({ _id: updatedRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Room update 1',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });
        await db.rooms.updateOne({ _id: updatedRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Room update 2',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:02:00.000Z')
          }
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest updated rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomUpdated,
            timestamp: new Date('2022-03-09T10:02:00.000Z'),
            isDeprecated: false,
            data: {
              _id: updatedRoom._id,
              name: 'Room update 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-joined\' activities than the set limit', () => {
      let latestJoinedRoom;

      beforeEach(async () => {
        await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Joined room 1',
          createdOn: new Date('2022-03-09T10:02:00.000Z'),
          updatedOn: new Date('2022-03-09T10:02:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:03:00.000Z') }]
        });
        latestJoinedRoom = await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Joined room 2',
          createdOn: new Date('2022-03-09T10:01:00.000Z'),
          updatedOn: new Date('2022-03-09T10:01:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:04:00.000Z') }]
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest joined rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomJoined,
            timestamp: new Date('2022-03-09T10:04:00.000Z'),
            isDeprecated: false,
            data: {
              _id: latestJoinedRoom._id,
              name: 'Joined room 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'marked-as-favorite\' activities than the set limit', () => {
      let latestFavorite;

      beforeEach(async () => {
        const favorite1 = await createTestRoom(container, { name: 'Favorite 1', owner: otherUser._id, createdBy: otherUser._id });
        const favorite2 = await createTestDocument(container, otherUser, { title: 'Favorite 2' });
        latestFavorite = await createTestDocument(container, otherUser, { title: 'Favorite 3' });
        await db.users.updateOne({ _id: user._id }, {
          $set: {
            favorites: [
              {
                type: FAVORITE_TYPE.room,
                setOn: new Date('2022-03-09T10:01:00.000Z'),
                id: favorite1._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:02:00.000Z'),
                id: favorite2._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:03:00.000Z'),
                id: latestFavorite._id
              }
            ]
          }
        });

        result = await sut.getActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest items marked as favorite', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: new Date('2022-03-09T10:03:00.000Z'),
            isDeprecated: false,
            data: {
              _id: latestFavorite._id,
              title: 'Favorite 3'
            }
          }
        ]);
      });
    });
  });

  describe('closeUserAccount', () => {
    let userFetchFromDbAfterAccountWasClosed;

    beforeEach(async () => {
      user.organization = 'My Organization';
      user.profileOverview = 'More about me';
      user.shortDescription = 'About me';
      user.role = ROLE.maintainer;
      user.emailNotificationFrequency = EMAIL_NOTIFICATION_FREQUENCY.daily;
      await updateTestUser(container, user);
      await sut.closeUserAccount(user._id);
      userFetchFromDbAfterAccountWasClosed = await db.users.findOne({ _id: user._id });
    });

    it('resets all user fields except for _id, email, displayName', () => {
      expect(userFetchFromDbAfterAccountWasClosed).toStrictEqual({
        _id: user._id,
        email: user.email,
        passwordHash: null,
        displayName: user.displayName,
        organization: '',
        profileOverview: '',
        shortDescription: '',
        role: ROLE.user,
        expiresOn: null,
        verificationCode: null,
        storage: {
          planId: null,
          usedBytes: 0,
          reminders: []
        },
        favorites: [],
        emailNotificationFrequency: EMAIL_NOTIFICATION_FREQUENCY.never,
        accountLockedOn: null,
        accountClosedOn: expect.any(Date),
        lastLoggedInOn: null
      });
    });
  });

});
