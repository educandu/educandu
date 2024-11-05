import { createSandbox } from 'sinon';
import ContactRequestService from './contact-request-service.js';
import { CONTACT_REQUEST_EXPIRATION_IN_DAYS } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser
} from '../test-helper.js';

describe('contact-request-service', () => {
  let sut;
  let user1;
  let user2;
  let result;
  let container;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    sut = container.get(ContactRequestService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    user1 = await createTestUser(container, { email: 'john-doe@test.com', password: 'john-doe-12345$$$', displayName: 'John Doe' });
    user2 = await createTestUser(container, { email: 'jane-doe@test.com', password: 'jane-doe-12345$$$', displayName: 'Jane Doe' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('createContactRequest', () => {
    describe('when the contact request from user1 to user2 already exists', () => {
      beforeEach(async () => {
        await sut.createContactRequest({
          fromUserId: user1._id,
          toUserId: user2._id,
          contactEmailAddress: 'write-me-here@john.com'
        });
      });

      it('should throw', async () => {
        const contactRequestToCreate = {
          fromUserId: user1._id,
          toUserId: user2._id,
          contactEmailAddress: 'better-write-me-here-instead@john.com'
        };

        await expect(() => sut.createContactRequest(contactRequestToCreate)).rejects.toThrow(`Contact request from user ${user1._id} to user ${user2._id} already exists!`);
      });
    });

    describe('when the contact request from user1 to user2 does not yet exist', () => {
      beforeEach(async () => {
        result = await sut.createContactRequest({
          fromUserId: user1._id,
          toUserId: user2._id,
          contactEmailAddress: 'write-me-here@john.com'
        });
      });

      it('should return the created contactRequest', () => {
        const expiresOn = new Date();
        expiresOn.setDate(expiresOn.getDate() + CONTACT_REQUEST_EXPIRATION_IN_DAYS);

        expect(result).toStrictEqual({
          _id: expect.stringMatching(/\w+/),
          fromUserId: user1._id,
          toUserId: user2._id,
          contactEmailAddress: 'write-me-here@john.com',
          createdOn: now,
          expiresOn
        });
      });
    });
  });
});
