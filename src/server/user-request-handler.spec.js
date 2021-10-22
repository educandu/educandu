import sinon from 'sinon';
import events from 'events';
import httpMocks from 'node-mocks-http';
import UserRequestHandler from './user-request-handler';
import { SAVE_USER_RESULT } from '../domain/user-management';

describe('user-request-handler', () => {

  const sandbox = sinon.createSandbox();
  let clientDataMapper;
  let userService;
  let mailService;
  let sut;

  beforeEach(() => {
    userService = {
      createUser: sandbox.stub(),
      updateUserAccount: sandbox.stub(),
      updateUserProfile: sandbox.stub(),
      getUserByEmailAddress: sandbox.stub(),
      createPasswordResetRequest: sandbox.stub()
    };
    mailService = {
      sendRegistrationVerificationLink: sandbox.stub(),
      sendPasswordResetRequestCompletionLink: sandbox.stub()
    };
    clientDataMapper = {
      dbUserToClientUser: sandbox.stub()
    };
    sut = new UserRequestHandler(userService, mailService, clientDataMapper);
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
        clientDataMapper.dbUserToClientUser.returns(mappedUser);

        sut.handlePostUser(req, res);
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should call sendRegistrationVerificationLink', () => {
        sinon.assert.calledWith(mailService.sendRegistrationVerificationLink, {
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

      it('should not call mailService.sendRegistrationVerificationLink', () => {
        sinon.assert.notCalled(mailService.sendRegistrationVerificationLink);
      });

      it('should not call clientDataMapper.dbUserToClientUser', () => {
        sinon.assert.notCalled(clientDataMapper.dbUserToClientUser);
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
          user: { _id: 1234 },
          body: { username: 'test1234', email: 'test@test.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.updateUserAccount.resolves({ result: SAVE_USER_RESULT.success, user: {} });
        clientDataMapper.dbUserToClientUser.returns(mappedUser);

        sut.handlePostUserAccount(req, res);
      });

      it('should call userService.updateUserAccount', () => {
        sinon.assert.calledWith(userService.updateUserAccount, { userId: 1234, username: 'test1234', email: 'test@test.com' });
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

      it('should not call clientDataMapper.dbUserToClientUser', () => {
        sinon.assert.notCalled(clientDataMapper.dbUserToClientUser);
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

        userService.getUserByEmailAddress.resolves(user);
        userService.createPasswordResetRequest.resolves({ _id: 'resetRequestId' });

        sut.handlePostUserPasswordResetRequest(req, res);
      });

      it('should call userService.createPasswordResetRequest', () => {
        sinon.assert.calledWith(userService.createPasswordResetRequest, user);
      });

      it('should call mailService.sendPasswordResetRequestCompletionLink', () => {
        sinon.assert.calledWith(mailService.sendPasswordResetRequestCompletionLink, { username: user.username,
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

        userService.getUserByEmailAddress.resolves(null);

        sut.handlePostUserPasswordResetRequest(req, res);
      });

      it('should not call userService.createPasswordResetRequest', () => {
        sinon.assert.notCalled(userService.createPasswordResetRequest);
      });

      it('should not call mailService.sendPasswordResetRequestCompletionLink', () => {
        sinon.assert.notCalled(mailService.sendPasswordResetRequestCompletionLink);
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
});
