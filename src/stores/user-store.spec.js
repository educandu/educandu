import UserStore from './user-store.js';
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

  describe('findUserByUsername', () => {
    describe('when provider doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsername({ provider: 'unknown', username: user.username });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when username doesn\'t match', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsername({ provider: user.provider, username: 'unknown' });
      });
      it('should return null', () => {
        expect(result).toEqual(null);
      });
    });

    describe('when provider and username match', () => {
      beforeEach(async () => {
        result = await sut.findUserByUsername({ provider: user.provider, username: user.username });
      });
      it('should return the user', () => {
        expect(result).toEqual(user);
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

});
