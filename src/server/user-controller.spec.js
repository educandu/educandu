import events from 'node:events';
import httpErrors from 'http-errors';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import cloneDeep from '../utils/clone-deep.js';
import UserController from './user-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAVORITE_TYPE, SAVE_USER_RESULT } from '../domain/constants.js';

const { NotFound, BadRequest } = httpErrors;

describe('user-controller', () => {

  const sandbox = createSandbox();

  let passwordResetRequestService;
  let requestLimitRecordService;
  let clientDataMappingService;
  let externalAccountService;
  let storageService;
  let pageRenderer;
  let serverConfig;
  let userService;
  let mailService;
  let roomService;
  let sut;

  beforeEach(() => {
    serverConfig = {};
    userService = {
      createUser: sandbox.stub(),
      verifyUser: sandbox.stub(),
      updateUserAccount: sandbox.stub(),
      updateUserProfile: sandbox.stub(),
      getUserById: sandbox.stub(),
      getActiveUserByEmailAddress: sandbox.stub(),
      addUserStorageReminder: sandbox.stub(),
      createPasswordResetRequest: sandbox.stub(),
      deleteAllUserStorageReminders: sandbox.stub(),
      addFavorite: sandbox.stub(),
      deleteFavorite: sandbox.stub(),
      recordUserLogIn: sandbox.stub()
    };
    storageService = {
      getAllStoragePlans: sandbox.stub()
    };
    passwordResetRequestService = {
      getRequestById: sandbox.stub()
    };
    requestLimitRecordService = {
      getCount: sandbox.stub(),
      incrementCount: sandbox.stub(),
      resetCount: sandbox.stub()
    };
    externalAccountService = {
      getAllExternalAccounts: sandbox.stub(),
      deleteExternalAccount: sandbox.stub(),
      updateExternalAccountUserId: sandbox.stub()
    };
    mailService = {
      sendRegistrationVerificationEmail: sandbox.stub(),
      sendPasswordResetEmail: sandbox.stub()
    };
    clientDataMappingService = {
      mapWebsiteUser: sandbox.stub(),
      mapDocsOrRevisions: sandbox.stub(),
      mapWebsitePublicUser: sandbox.stub(),
      mapExternalAccountsForAdminArea: sandbox.stub()
    };
    pageRenderer = {
      sendPage: sandbox.stub()
    };

    sut = new UserController(
      serverConfig,
      userService,
      storageService,
      passwordResetRequestService,
      requestLimitRecordService,
      externalAccountService,
      mailService,
      clientDataMappingService,
      roomService,
      pageRenderer
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetUserProfilePage', () => {
    let req;
    let res;

    describe('when the viewed user does not exist', () => {
      beforeEach(() => {
        const userId = uniqueId.create();
        req = { params: { userId } };
        res = {};

        userService.getUserById.withArgs(userId).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetUserProfilePage(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the viewed user exists', () => {
      let mappedViewedUser;

      beforeEach(() => {
        const viewedUser = {
          _id: uniqueId.create(),
          email: 'educandu@test.com',
          organization: 'Educandu',
          introduction: 'Educandu test user',
          accountClosedOn: new Date()
        };
        const viewingUser = { _id: uniqueId.create() };

        req = {
          user: viewingUser,
          params: { userId: viewedUser._id }
        };
        res = {};

        mappedViewedUser = cloneDeep(viewedUser);

        userService.getUserById.withArgs(viewedUser._id).resolves(viewedUser);

        clientDataMappingService.mapWebsitePublicUser.withArgs({ viewingUser, viewedUser }).returns(mappedViewedUser);
        pageRenderer.sendPage.resolves();

        return sut.handleGetUserProfilePage(req, res);
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'user-profile', {
          user: mappedViewedUser
        });
      });
    });
  });

  describe('handlePostUserRegistrationRequest', () => {
    let req;
    let res;
    const mappedUser = {};

    describe('with all data correctly provided', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { email: 'test@test.com', password: 'abcd1234', displayName: 'Test 1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.success, user: { verificationCode: 'je8ghFD7Gg88jkdhfjkh48' } });
        clientDataMappingService.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUserRegistrationRequest(req, res).catch(reject);
      }));

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call sendRegistrationVerificationEmail', () => {
        assert.calledWith(mailService.sendRegistrationVerificationEmail, {
          email: 'test@test.com',
          displayName: 'Test 1234',
          verificationCode: 'je8ghFD7Gg88jkdhfjkh48'
        });
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.success);
        expect(response.user).toEqual(mappedUser);
      });
    });

    describe('when user creation fails', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { email: 'test@test.com', password: 'abcd1234', displayName: 'Test 1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUserRegistrationRequest(req, res).catch(reject);
      }));

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should not call mailService.sendRegistrationVerificationEmail', () => {
        assert.notCalled(mailService.sendRegistrationVerificationEmail);
      });

      it('should not call clientDataMappingService.mapWebsiteUser', () => {
        assert.notCalled(clientDataMappingService.mapWebsiteUser);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.duplicateEmail);
        expect(response.user).toBe(null);
      });
    });

  });

  describe('handlePostUserRegistrationCompletion', () => {
    let req;
    let res;
    const dbUser = { _id: 'cnztc5ztm41mx03z' };
    const mappedUser = { _id: 'cnztc5ztm41mx03z' };

    describe('when a pending user with the specified verification code exists', () => {
      describe('and there is no external account in the session', () => {
        beforeEach(() => new Promise((resolve, reject) => {
          req = httpMocks.createRequest({
            protocol: 'https',
            headers: { host: 'localhost' },
            session: { externalAccount: null },
            body: { userId: 'cnztc5ztm41mx03z', verificationCode: '3xzrxzt43z0xtm1' },
            login: sandbox.stub().callsArg(1)
          });
          res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

          res.on('end', resolve);

          userService.verifyUser.withArgs(req.body.userId, req.body.verificationCode).resolves(dbUser);
          userService.recordUserLogIn.withArgs(req.body.userId).resolves(dbUser);
          clientDataMappingService.mapWebsiteUser.returns(mappedUser);

          sut.handlePostUserRegistrationCompletion(req, res).catch(reject);
        }));

        it('should set the status code on the response to 201', () => {
          expect(res.statusCode).toBe(201);
        });

        it('should call clientDataMappingService.mapWebsiteUser', () => {
          assert.calledWith(clientDataMappingService.mapWebsiteUser, mappedUser);
        });

        it('should login the new user', () => {
          assert.calledWith(req.login, mappedUser);
        });

        it('should return the result object', () => {
          const response = res._getData();
          expect(response).toEqual({ user: mappedUser, connectedExternalAccountId: null });
        });
      });
      describe('and there is an external account in the session', () => {
        beforeEach(() => new Promise((resolve, reject) => {
          req = httpMocks.createRequest({
            protocol: 'https',
            headers: { host: 'localhost' },
            session: { externalAccount: { _id: '8nTNn043zm7y02743zcn' } },
            body: { userId: 'cnztc5ztm41mx03z', verificationCode: '3xzrxzt43z0xtm1' },
            login: sandbox.stub().callsArg(1)
          });
          res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

          res.on('end', resolve);

          userService.verifyUser.resolves(dbUser);
          clientDataMappingService.mapWebsiteUser.returns(mappedUser);
          userService.recordUserLogIn.withArgs(req.body.userId).resolves(dbUser);

          sut.handlePostUserRegistrationCompletion(req, res).catch(reject);
        }));

        it('should set the status code on the response to 201', () => {
          expect(res.statusCode).toBe(201);
        });

        it('should call clientDataMappingService.mapWebsiteUser', () => {
          assert.calledWith(clientDataMappingService.mapWebsiteUser, dbUser);
        });

        it('should connect the external account with the newly created user', () => {
          assert.calledWith(externalAccountService.updateExternalAccountUserId, {
            externalAccountId: '8nTNn043zm7y02743zcn',
            userId: 'cnztc5ztm41mx03z'
          });
        });

        it('should remove the external account from the session', () => {
          expect(req.session.externalAccount).toBeNull();
        });

        it('should login the new user', () => {
          assert.calledWith(req.login, dbUser);
        });

        it('should return the result object', () => {
          const response = res._getData();
          expect(response).toEqual({ user: mappedUser, connectedExternalAccountId: '8nTNn043zm7y02743zcn' });
        });
      });
    });

    describe('when no pending user with the specified verification code exists', () => {
      beforeEach(() => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          session: { externalAccount: null },
          body: { userId: 'cnztc5ztm41mx03z', verificationCode: '3xzrxzt43z0xtm1' },
          login: sandbox.stub().callsArg(1)
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        userService.verifyUser.resolves(null);
      });

      it('should throw a NotFound error', () => {
        expect(() => sut.handlePostUserRegistrationCompletion(req, res)).rejects.toThrow(NotFound);
      });
    });

  });

  describe('handlePostUserAccount', () => {
    let req;
    let res;
    const mappedUser = {};

    describe('with all data correctly provided', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'test@test.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.updateUserAccount.resolves({ result: SAVE_USER_RESULT.success, user: {} });
        clientDataMappingService.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUserAccount(req, res).catch(reject);
      }));

      it('should call userService.updateUserAccount', () => {
        assert.calledWith(userService.updateUserAccount, { userId: 1234, email: 'test@test.com' });
      });

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response.result).toBe(SAVE_USER_RESULT.success);
        expect(response.user).toEqual(mappedUser);
      });
    });

    describe('when user creation fails', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'test@test.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.updateUserAccount.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUserAccount(req, res).catch(reject);
      }));

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should not call clientDataMappingService.mapWebsiteUser', () => {
        assert.notCalled(clientDataMappingService.mapWebsiteUser);
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
    const mappedUser = { displayName: 'John Doe' };

    describe('with all data correctly provided', () => {
      const displayName = 'John Doe';
      const organization = 'Educandu';
      const introduction = 'Educandu test user';

      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { displayName, organization, introduction }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.updateUserProfile.resolves({});
        clientDataMappingService.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUserProfile(req, res).catch(reject);
      }));

      it('should call userService.updateUserProfile', () => {
        assert.calledWith(userService.updateUserProfile, { userId: 1234, displayName, organization, introduction });
      });

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual({ user: mappedUser });
      });
    });

    describe('with invalid user id', () => {
      const displayName = 'John Doe';

      beforeEach(() => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { displayName }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });
        userService.updateUserProfile.resolves(null);
      });

      it('should throw a not found error', () => {
        expect(() => sut.handlePostUserProfile(req, res)).rejects.toThrowError(NotFound);
      });
    });
  });

  describe('handlePostUserPasswordResetRequest', () => {
    let req;
    let res;

    describe('with known email', () => {
      const user = {
        displayName: 'johndoe',
        email: 'john.doe@gmail.com'
      };

      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'john.doe@gmail.com', password: 'hushhush' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.getActiveUserByEmailAddress.resolves(user);
        userService.createPasswordResetRequest.resolves({ _id: 'resetRequestId', verificationCode: 'je8ghFD7Gg88jkdhfjkh48' });

        sut.handlePostUserPasswordResetRequest(req, res).catch(reject);
      }));

      it('should call userService.createPasswordResetRequest', () => {
        assert.calledWith(userService.createPasswordResetRequest, user, 'hushhush');
      });

      it('should call mailService.sendPasswordResetEmail', () => {
        assert.calledWith(mailService.sendPasswordResetEmail, {
          email: user.email,
          displayName: user.displayName,
          verificationCode: 'je8ghFD7Gg88jkdhfjkh48'
        });
      });

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the passwordResetRequestId', () => {
        const response = res._getData();
        expect(response).toEqual({ passwordResetRequestId: 'resetRequestId' });
      });
    });

    describe('with unknown email', () => {

      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          user: { _id: 1234 },
          body: { email: 'john.doe@gmail.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.getActiveUserByEmailAddress.resolves(null);

        sut.handlePostUserPasswordResetRequest(req, res).catch(reject);
      }));

      it('should not call userService.createPasswordResetRequest', () => {
        assert.notCalled(userService.createPasswordResetRequest);
      });

      it('should not call mailService.sendPasswordResetEmail', () => {
        assert.notCalled(mailService.sendPasswordResetEmail);
      });

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
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

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: { _id: '12345' },
        params: { userId: 'abcde' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', resolve);

      userService.addUserStorageReminder.resolves(serviceResponse);

      sut.handlePostUserStorageReminder(req, res).catch(reject);
    }));

    it('should call userService.addUserStorageReminder', () => {
      assert.calledWith(userService.addUserStorageReminder, 'abcde', { _id: '12345' });
    });

    it('should set the status code on the response to 201', () => {
      expect(res.statusCode).toBe(201);
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

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: { _id: '12345' },
        params: { userId: 'abcde' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', resolve);

      userService.deleteAllUserStorageReminders.resolves(serviceResponse);

      sut.handleDeleteAllUserStorageReminders(req, res).catch(reject);
    }));

    it('should call userService.deleteAllUserStorageReminders', () => {
      assert.calledWith(userService.deleteAllUserStorageReminders, 'abcde');
    });

    it('should set the status code on the response to 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the result object', () => {
      const response = res._getData();
      expect(response).toBe(serviceResponse);
    });
  });

  describe('handlePostFavorite', () => {
    let req;
    let res;
    const requestUser = {
      _id: 1234,
      favorites: []
    };
    const mappedUser = {
      ...requestUser,
      favorites: [
        {
          type: FAVORITE_TYPE.document,
          id: '4589ct29nr76n4x9214',
          setOn: new Date().toISOString()
        }
      ]
    };

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: requestUser,
        body: { type: FAVORITE_TYPE.document, id: '4589ct29nr76n4x9214' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', resolve);

      userService.addFavorite.resolves();
      clientDataMappingService.mapWebsiteUser.returns(mappedUser);

      sut.handlePostFavorite(req, res).catch(reject);
    }));

    it('should call userService.addFavorite', () => {
      assert.calledWith(userService.addFavorite, { type: FAVORITE_TYPE.document, id: '4589ct29nr76n4x9214', user: requestUser });
    });

    it('should set the status code on the response to 201', () => {
      expect(res.statusCode).toBe(201);
    });

    it('should return the result object', () => {
      const response = res._getData();
      expect(response).toBe(mappedUser);
    });
  });

  describe('handleDeleteFavorite', () => {
    let req;
    let res;
    const requestUser = {
      _id: 1234,
      favorites: [
        {
          type: FAVORITE_TYPE.document,
          id: '4589ct29nr76n4x9214',
          setOn: new Date()
        }
      ]
    };
    const mappedUser = {
      ...requestUser,
      favorites: []
    };

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        user: requestUser,
        body: { type: FAVORITE_TYPE.document, id: '4589ct29nr76n4x9214' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

      res.on('end', resolve);

      userService.deleteFavorite.resolves();
      clientDataMappingService.mapWebsiteUser.returns(mappedUser);

      sut.handleDeleteFavorite(req, res).catch(reject);
    }));

    it('should call userService.deleteFavorite', () => {
      assert.calledWith(userService.deleteFavorite, { type: FAVORITE_TYPE.document, id: '4589ct29nr76n4x9214', user: requestUser });
    });

    it('should set the status code on the response to 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the result object', () => {
      const response = res._getData();
      expect(response).toBe(mappedUser);
    });
  });

  describe('handleDeleteAbortExternalAccountConnection', () => {
    let req;
    let res;

    describe('when there is an externalAccount in the session', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          session: { externalAccount: {} }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });
        res.on('end', resolve);
        sut.handleDeleteAbortExternalAccountConnection(req, res).catch(reject);
      }));
      it('should delete the externalAccount from the session', () => {
        expect(req.session).not.toHaveProperty('externalAccount');
      });
      it('should set the status code on the response to 204', () => {
        expect(res.statusCode).toBe(204);
      });
    });

    describe('when there is no externalAccount in the session', () => {
      beforeEach(() => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          session: {}
        });
      });
      it('should throw BadRequest', async () => {
        await expect(() => sut.handleDeleteAbortExternalAccountConnection(req, res)).toThrow(BadRequest);
      });
    });
  });

  describe('handleGetExternalUserAccounts', () => {
    let req;
    let res;
    const externalAccounts = [{ _id: 'original-account' }];
    const mappedExternalAccounts = [{ _id: 'mapped-account' }];

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });
      res.on('end', resolve);
      externalAccountService.getAllExternalAccounts.resolves(externalAccounts);
      clientDataMappingService.mapExternalAccountsForAdminArea.returns(mappedExternalAccounts);
      sut.handleGetExternalUserAccounts(req, res).catch(reject);
    }));

    it('should call externalAccountService.getAllExternalAccounts', () => {
      assert.calledOnce(externalAccountService.getAllExternalAccounts);
    });

    it('should call clientDataMappingService.mapExternalAccountsForAdminArea', () => {
      assert.calledWith(clientDataMappingService.mapExternalAccountsForAdminArea, externalAccounts);
    });

    it('should set the status code on the response to 200', () => {
      expect(res.statusCode).toBe(200);
    });

    it('should return the external accounts', () => {
      expect(res._getData()).toEqual({ externalAccounts: mappedExternalAccounts });
    });
  });

  describe('handleDeleteExternalUserAccount', () => {
    let req;
    let res;
    const externalAccountId = '23xjnzx7xtnxn8x1';

    beforeEach(() => new Promise((resolve, reject) => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'localhost' },
        params: { externalAccountId }
      });
      res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });
      res.on('end', resolve);
      externalAccountService.deleteExternalAccount.withArgs({ externalAccountId }).resolves();
      sut.handleDeleteExternalUserAccount(req, res).catch(reject);
    }));

    it('should call externalAccountService.deleteExternalAccount with the external account ID', () => {
      assert.calledWith(externalAccountService.deleteExternalAccount, { externalAccountId });
    });

    it('should set the status code on the response to 204', () => {
      expect(res.statusCode).toBe(204);
    });
  });
});
