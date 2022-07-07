import UserStore from './user-store.js';
import { FAVORITE_TYPE } from '../domain/constants.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser } from '../test-helper.js';

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
    user = await setupTestUser(container, { username: 'mark', email: 'mark@markson.com', provider: 'educandu' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('findUserByVerificationCode', () => {
    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByVerificationCode({ provider: 'unknown', verificationCode: user.verificationCode });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when verificationCode doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByVerificationCode({ provider: user.provider, verificationCode: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when provider and verificationCode match', () => {
      beforeEach(async () => {
        result = await sut.findUserByVerificationCode({ provider: user.provider, verificationCode: user.verificationCode });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });
  });

  describe('findActiveUsersByEmailOrUsername', () => {
    let matchingUsernameUser;
    let matchingEmailUser;
    let otherProviderUser;
    let closedAccountUser;

    beforeEach(async () => {
      matchingUsernameUser = await setupTestUser(container, { username: 'username', email: 'other_1' });
      matchingEmailUser = await setupTestUser(container, { username: 'other_2', email: 'email' });
      otherProviderUser = await setupTestUser(container, { username: 'other_3', email: 'other_3' });
      await sut.saveUser({ ...otherProviderUser, username: 'username', provider: 'other_3' });
      closedAccountUser = await setupTestUser(container, { username: 'other_4', email: 'other_4' });
      await sut.saveUser({ ...closedAccountUser, email: 'email', accountClosedOn: new Date() });

      result = await sut.findActiveUsersByEmailOrUsername({ provider: 'educandu', username: 'username', email: 'email' });
    });

    it('should return all matching active users', () => {
      expect(result).toEqual([matchingUsernameUser, matchingEmailUser]);
    });
  });

  describe('findActiveUserByProviderAndEmail', () => {
    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findActiveUserByProviderAndEmail({ provider: 'unknown', email: user.email });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when email doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findActiveUserByProviderAndEmail({ provider: user.provider, email: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when account is closed', () => {
      beforeEach(async () => {
        const currentUser = await setupTestUser(container, { username: 'jim', email: 'jim@jameson.com', provider: 'educandu', accountClosedOn: new Date() });
        result = await sut.findActiveUserByProviderAndEmail({ provider: currentUser.provider, currentUser: user.email });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when account is open', () => {
      beforeEach(async () => {
        result = await sut.findActiveUserByProviderAndEmail({ provider: user.provider, email: user.email });
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
          { type: FAVORITE_TYPE.lesson, id: 'm9vc9qmhc9qcwas', setOn: favoriteSetOnDate }
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
      expect(updatedUser.favorites).toStrictEqual([{ type: FAVORITE_TYPE.lesson, id: 'm9vc9qmhc9qcwas', setOn: favoriteSetOnDate }]);
    });
  });

});
