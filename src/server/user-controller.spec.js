import sinon from 'sinon';
import events from 'events';
import httpMocks from 'node-mocks-http';
import sut from './user-request-handlers';
import { SAVE_USER_RESULT } from '../domain/user-management';

describe('user-request-handlers', () => {

  const sandbox = sinon.createSandbox();
  let clientDataMapper;
  let userService;
  let mailService;

  beforeEach(() => {
    clientDataMapper = {
      dbUserToClientUser: sandbox.stub()
    };
    userService = {
      createUser: sandbox.stub()
    };
    mailService = {
      sendRegistrationVerificationLink: sandbox.stub()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleUsersPost', () => {
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

        sut.handlePostUser({ req, res, clientDataMapper, mailService, userService });
      });

      it('should set the status code on the response to 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should call sendRegistrationVerificationLink', () => {
        sinon.assert.calledWith(mailService.sendRegistrationVerificationLink, 'test@test.com', 'https://localhost/complete-registration/verificationCode');
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.success);
        expect(response.user).toEqual(mappedUser);
      });
    });

    describe('and user email not lower cased', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { username: 'test1234', email: 'TEST@test.com', password: 'abcd1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        sut.handlePostUser({ req, res, clientDataMapper, mailService, userService });
      });

      it('should set the status code on the response to 400', () => {
        expect(res.statusCode).toBe(400);
      });

      it('should not call mailService.sendRegistrationVerificationLink', () => {
        sinon.assert.notCalled(mailService.sendRegistrationVerificationLink);
      });

      it('should not call clientDataMapper.dbUserToClientUser', () => {
        sinon.assert.notCalled(clientDataMapper.dbUserToClientUser);
      });

      it('should return a message', () => {
        const response = res._getData();
        expect(response).toBe('The \'email\' field is expected to be in lower case.');
      });
    });

    describe('and user creation fails', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { username: 'test1234', email: 'test@test.com', password: 'abcd1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', done);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUser({ req, res, clientDataMapper, mailService, userService });
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

});
