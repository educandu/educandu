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
    user = await setupTestUser(container, { email: 'mark@markson.com', displayName: 'Mark', provider: 'educandu' });
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

  describe('findActiveUsersByEmail', () => {
    let matchingEmailUser;
    let otherProviderUser;
    let closedAccountUser;

    beforeEach(async () => {
      matchingEmailUser = await setupTestUser(container, { email: 'email', displayName: 'Other user 2' });
      otherProviderUser = await setupTestUser(container, { email: 'other_3', displayName: 'Other user 3' });
      await sut.saveUser({ ...otherProviderUser, provider: 'other_3', displayName: 'Other user' });
      closedAccountUser = await setupTestUser(container, { email: 'other_4', displayName: 'Other user 4' });
      await sut.saveUser({ ...closedAccountUser, email: 'email', accountClosedOn: new Date() });

      result = await sut.findActiveUsersByEmail({ email: 'email', provider: 'educandu' });
    });

    it('should return all matching active users', () => {
      expect(result).toEqual([matchingEmailUser]);
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
        const currentUser = await setupTestUser(container, { email: 'jim@jameson.com', displayName: 'Jim', provider: 'educandu', accountClosedOn: new Date() });
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
