import UserStore from './user-store.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, createTestUser } from '../test-helper.js';

describe('user-store', () => {
  let sut;
  let user;
  let result;
  let container;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(UserStore);
  });

  beforeEach(async () => {
    user = await createTestUser(container, { email: 'mark@markson.com', displayName: 'Mark' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('findUserByVerificationCode', () => {
    describe('when verificationCode doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByVerificationCode('unknown');
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when verificationCode matches', () => {
      beforeEach(async () => {
        result = await sut.findUserByVerificationCode(user.verificationCode);
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });
  });

  describe('findActiveUserByEmail', () => {
    describe('when email doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findActiveUserByEmail('unknown');
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when account is closed', () => {
      beforeEach(async () => {
        const currentUser = await createTestUser(container, { email: 'jim@jameson.com', displayName: 'Jim', accountClosedOn: new Date() });
        result = await sut.findActiveUserByEmail(currentUser.email);
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when account is open', () => {
      beforeEach(async () => {
        result = await sut.findActiveUserByEmail(user.email);
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });
  });

  describe('addToUserFavorites', () => {
    let updatedUser;
    const favoriteSetOnDate = new Date();

    beforeEach(async () => {
      await sut.addToUserFavorites({
        userId: user._id,
        favoriteType: FAVORITE_TYPE.room,
        favoriteId: '4827ztc1487xmnm',
        favoriteSetOn: favoriteSetOnDate
      });

      updatedUser = await sut.getUserById(user._id);
    });

    it('should add a new entry into the favorites array', () => {
      expect(updatedUser.favorites).toStrictEqual([{ type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: favoriteSetOnDate }]);
    });
  });

  describe('removeFromUserFavorites', () => {
    let updatedUser;
    const favoriteSetOnDate = new Date();

    beforeEach(async () => {
      await sut.saveUser({
        ...user,
        favorites: [
          { type: FAVORITE_TYPE.room, id: '4827ztc1487xmnm', setOn: favoriteSetOnDate },
          { type: FAVORITE_TYPE.document, id: 'm9vc9qmhc9qcwas', setOn: favoriteSetOnDate }
        ]
      });

      await sut.removeFromUserFavorites({
        userId: user._id,
        favoriteType: FAVORITE_TYPE.room,
        favoriteId: '4827ztc1487xmnm'
      });

      updatedUser = await sut.getUserById(user._id);
    });

    it('should remove only the entry with matching criteria from the favorites array', () => {
      expect(updatedUser.favorites).toStrictEqual([{ type: FAVORITE_TYPE.document, id: 'm9vc9qmhc9qcwas', setOn: favoriteSetOnDate }]);
    });
  });

});
