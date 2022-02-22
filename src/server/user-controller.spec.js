import sinon from 'sinon';
import events from 'events';
import httpMocks from 'node-mocks-http';
import UserController from './user-controller.js';
import { SAVE_USER_RESULT } from '../domain/constants.js';

describe('user-controller', () => {

  const sandbox = sinon.createSandbox();
  let passwordResetRequestStore;
  let storagePlanStore;
  let clientDataMapper;
  let userService;
  let mailService;
  let userStore;
  let sut;

  beforeEach(() => {
    userStore = {
      getUserByEmailAddress: sandbox.stub()
    };
    storagePlanStore = {
      getAllStoragePlans: sandbox.stub()
    };
    passwordResetRequestStore = {
      getRequestById: sandbox.stub()
    };
    userService = {
      createUser: sandbox.stub(),
      updateUserAccount: sandbox.stub(),
      updateUserProfile: sandbox.stub(),
      createPasswordResetRequest: sandbox.stub(),
      addUserStorageReminder: sandbox.stub(),
      deleteAllUserStorageReminders: sandbox.stub()
    };
    mailService = {
      sendRegistrationVerificationEmail: sandbox.stub(),
      sendPasswordResetEmail: sandbox.stub()
    };
    clientDataMapper = {
      mapWebsiteUser: sandbox.stub()
    };
    const serverConfig = {};
    const database = {};
    const pageRenderer = {};

    sut = new UserController(
      serverConfig,
      database,
      userStore,
      storagePlanStore,
      passwordResetRequestStore,
      userService,
      mailService,
      clientDataMapper,
      pageRenderer
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostUser', () => {
    let req;
    let res;
    const mappedUser = {};

    describe('with all data correctly provided', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { username: 'test1234', email: 'test@test.com', password: 'abcd1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.success, user: { verificationCode: 'verificationCode' } });
        clientDataMapper.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUser(req, res);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should call sendRegistrationVerificationEmail', () => {
        sinon.assert.calledWith(mailService.sendRegistrationVerificationEmail, {
          username: 'test1234',
          email: 'test@test.com',
          verificationLink: 'https://localhost/complete-registration/verificationCode'
        });
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.success);
        expect(response.user).toEqual(mappedUser);
      });
    });

    describe('when user creation fails', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { username: 'test1234', email: 'test@test.com', password: 'abcd1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUser(req, res);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should not call mailService.sendRegistrationVerificationEmail', () => {
        sinon.assert.notCalled(mailService.sendRegistrationVerificationEmail);
      });

      it('should not call clientDataMapper.mapWebsiteUser', () => {
        sinon.assert.notCalled(clientDataMapper.mapWebsiteUser);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.duplicateEmail);
        expect(response.user).toBe(null);
      });
    });

  });

  describe('handlePostUserAccount', () => {
    let req;
    let res;
    const mappedUser = {};

    describe('with all data correctly provided', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234, provider: 'educandu' },
          body: { username: 'test1234', email: 'test@test.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.updateUserAccount.resolves({ result: SAVE_USER_RESULT.success, user: {} });
        clientDataMapper.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUserAccount(req, res);
      });

      it('should call userService.updateUserAccount', () => {
        sinon.assert.calledWith(userService.updateUserAccount, { userId: 1234, provider: 'educandu', username: 'test1234', email: 'test@test.com' });
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.success);
        expect(response.user).toEqual(mappedUser);
      });
    });

    describe('when user creation fails', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { username: 'test1234', email: 'test@test.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.updateUserAccount.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUserAccount(req, res);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should not call clientDataMapper.mapWebsiteUser', () => {
        sinon.assert.notCalled(clientDataMapper.mapWebsiteUser);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.duplicateEmail);
        expect(response.user).toBe(null);
      });
    });

  });

  describe('handlePostUserProfile', () => {
    let req;
    let res;

    describe('with all data correctly provided', () => {
      const profile = { firstName: 'john', lastName: 'doe' };

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { profile }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.updateUserProfile.resolves(profile);

        sut.handlePostUserProfile(req, res);
      });

      it('should call userService.updateUserProfile', () => {
        sinon.assert.calledWith(userService.updateUserProfile, 1234, profile);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual({ profile });
      });
    });

    describe('with invalid user id', () => {
      const profile = { firstName: 'john', lastName: 'doe' };

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { profile }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.updateUserProfile.resolves(null);

        sut.handlePostUserProfile(req, res);
      });

      it('should call userService.updateUserProfile', () => {
        sinon.assert.calledWith(userService.updateUserProfile, 1234, profile);
      });

      it('should set the status code on the response to 404', () => {
        expect(res.statusCode).toBe(404);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual('Invalid user id');
      });
    });
  });

  describe('handlePostUserPasswordResetRequest', () => {
    let req;
    let res;

    describe('with known email', () => {
      const user = {
        username: 'johndoe',
        email: 'john.doe@gmail.com'
      };

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'john.doe@gmail.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userStore.getUserByEmailAddress.resolves(user);
        userService.createPasswordResetRequest.resolves({ _id: 'resetRequestId' });

        sut.handlePostUserPasswordResetRequest(req, res);
      });

      it('should call userService.createPasswordResetRequest', () => {
        sinon.assert.calledWith(userService.createPasswordResetRequest, user);
      });

      it('should call mailService.sendPasswordResetEmail', () => {
        sinon.assert.calledWith(mailService.sendPasswordResetEmail, { username: user.username,
          email: user.email,
          completionLink: 'https://localhost/complete-password-reset/resetRequestId' });
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual({});
      });
    });

    describe('with unknown email', () => {

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'john.doe@gmail.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userStore.getUserByEmailAddress.resolves(null);

        sut.handlePostUserPasswordResetRequest(req, res);
      });

      it('should not call userService.createPasswordResetRequest', () => {
        sinon.assert.notCalled(userService.createPasswordResetRequest);
      });

      it('should not call mailService.sendPasswordResetEmail', () => {
        sinon.assert.notCalled(mailService.sendPasswordResetEmail);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual({});
      });
    });
  });

  describe('handlePostUserStorageReminder', () => {
    let req;
    let res;
    const serviceResponse = { reminders: [{ timestamp: new Date(), createdBy: '12345' }] };

    beforeEach(done => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: { _id: '12345' },
        params: { userId: 'abcde' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', done);

      userService.addUserStorageReminder.resolves(serviceResponse);

      sut.handlePostUserStorageReminder(req, res);
    });

    it('should call userService.addUserStorageReminder', () => {
      sinon.assert.calledWith(userService.addUserStorageReminder, 'abcde', { _id: '12345' });
    });

    it('should set the status code on the response to 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the result object', () => {
      const response = res._getData();
      expect(response).toBe(serviceResponse);
    });
  });

  describe('handleDeleteAllUserStorageReminders', () => {
    let req;
    let res;
    const serviceResponse = { reminders: [{ timestamp: new Date(), createdBy: '12345' }] };

    beforeEach(done => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: { _id: '12345' },
        params: { userId: 'abcde' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', done);

      userService.deleteAllUserStorageReminders.resolves(serviceResponse);

      sut.handleDeleteAllUserStorageReminders(req, res);
    });

    it('should call userService.deleteAllUserStorageReminders', () => {
      sinon.assert.calledWith(userService.deleteAllUserStorageReminders, 'abcde');
    });

    it('should set the status code on the response to 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the result object', () => {
      const response = res._getData();
      expect(response).toBe(serviceResponse);
    });
  });

});
