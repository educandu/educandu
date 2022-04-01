import UserStore from './user-store.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser } from '../test-helper.js';
import { FAVORITE_TYPE } from '../domain/constants.js';

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

  describe('findUserByLogin', () => {
    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByLogin({ provider: 'unknown', emailOrUsername: user.username });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when emailOrUsername doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByLogin({ provider: user.provider, emailOrUsername: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when provider matches and emailOrUsername matches the email', () => {
      beforeEach(async () => {
        result = await sut.findUserByLogin({ provider: user.provider, emailOrUsername: user.email });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when provider matches and emailOrUsername matches the username', () => {
      beforeEach(async () => {
        result = await sut.findUserByLogin({ provider: user.provider, emailOrUsername: user.username });
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
        user1 = await setupTestUser(container, { username: 'peter', email: 'peter@peterson.com', provider: 'educandu' });
        user2 = await setupTestUser(container, { username: 'peter@peterson.com', email: 'different-peter@peterson.com', provider: 'educandu' });
        result1 = await sut.findUserByLogin({ provider: user.provider, emailOrUsername: 'peter@peterson.com' });
        result2 = await sut.findUserByLogin({ provider: user.provider, emailOrUsername: 'different-peter@peterson.com' });
      });
      it('should return the user where the email matches', () => {
        expect(result1).toEqual(user1);
      });
      it('should still find the other user by email', () => {
        expect(result2).toEqual(user2);
      });
    });
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

  describe('findUserByUsernameOrEmail', () => {
    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsernameOrEmail({ provider: 'unknown', username: user.username, email: user.email });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when neider username nor email matches', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsernameOrEmail({ provider: user.provider, username: 'unknown', email: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when username matches', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsernameOrEmail({ provider: user.provider, username: user.username, email: 'unknown' });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when email matches', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsernameOrEmail({ provider: user.provider, username: 'unknown', email: user.email });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
      });
    });
  });

  describe('findDifferentUserByUsernameOrEmail', () => {
    describe('when the only user with the same provider and username is the given user', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: user._id, provider: user.provider, username: user.username, email: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when the only user with the same provider and email is the given user', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: user._id, provider: user.provider, username: 'unknown', email: user.email });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when there is another user with the same username but different provider', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: 'unknown', provider: 'unknown', username: user.username, email: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when there is another user with the same email but different provider', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: 'unknown', provider: 'unknown', username: 'unknown', email: user.email });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when there is another user with the same username and provider', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: 'unknown', provider: user.provider, username: user.username, email: 'unknown' });
      });
      it('should return the other user', () => {
        expect(result).toEqual(user);
      });
    });

    describe('when there is another user with the same email and provider', () => {
      beforeEach(async () => {
        result = await sut.findDifferentUserByUsernameOrEmail({ userId: 'unknown', provider: user.provider, username: 'unknown', email: user.email });
      });
      it('should return the other user', () => {
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
