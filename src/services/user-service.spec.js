import httpErrors from 'http-errors';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest, NotFound } = httpErrors;

describe('user-service', () => {
  let db;
  let sut;
  let user;
  let container;
  let storagePlan;
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
    storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 500 * 1000 * 1000 };
    await db.storagePlans.insertOne(storagePlan);
    user = await setupTestUser(container, { username: 'John Doe', email: 'john-doe@test.com' });
    executingUser = await setupTestUser(container, { username: 'Emilia Watson', email: 'emilia-watson@test.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('updateUserStoragePlan', () => {
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
      beforeEach(async () => {
        await db.users.updateOne(
          { _id: user._id },
          { $set: { storage: { plan: 'some-other-plan-id', usedBytes: 0, reminders: [] } } }
        );
      });
      it('should throw a bad request error', () => {
        expect(() => sut.updateUserStoragePlan(user._id, storagePlan._id)).rejects.toThrowError(BadRequest);
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

});
