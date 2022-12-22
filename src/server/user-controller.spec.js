import events from 'node:events';
import httpErrors from 'http-errors';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import cloneDeep from '../utils/clone-deep.js';
import UserController from './user-controller.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAVORITE_TYPE, SAVE_USER_RESULT } from '../domain/constants.js';

const { NotFound } = httpErrors;

describe('user-controller', () => {

  const sandbox = createSandbox();

  let passwordResetRequestService;
  let requestLimitRecordService;
  let clientDataMappingService;
  let documentService;
  let storageService;
  let pageRenderer;
  let userService;
  let mailService;
  let roomService;
  let sut;

  beforeEach(() => {
    userService = {
      createUser: sandbox.stub(),
      updateUserAccount: sandbox.stub(),
      updateUserProfile: sandbox.stub(),
      getUserById: sandbox.stub(),
      getActiveUserByEmailAddress: sandbox.stub(),
      addUserStorageReminder: sandbox.stub(),
      createPasswordResetRequest: sandbox.stub(),
      deleteAllUserStorageReminders: sandbox.stub(),
      addFavorite: sandbox.stub(),
      deleteFavorite: sandbox.stub()
    };
    storageService = {
      getAllStoragePlans: sandbox.stub()
    };
    documentService = {
      getMetadataOfLatestPublicDocumentsCreatedByUser: sandbox.stub()
    };
    passwordResetRequestService = {
      getRequestById: sandbox.stub()
    };
    requestLimitRecordService = {
      getCount: sandbox.stub(),
      incrementCount: sandbox.stub(),
      resetCount: sandbox.stub()
    };
    mailService = {
      sendRegistrationVerificationEmail: sandbox.stub(),
      sendPasswordResetEmail: sandbox.stub()
    };
    clientDataMappingService = {
      mapRooms: sandbox.stub(),
      mapWebsiteUser: sandbox.stub(),
      mapDocsOrRevisions: sandbox.stub(),
      mapWebsitePublicUser: sandbox.stub()
    };
    pageRenderer = {
      sendPage: sandbox.stub()
    };
    const serverConfig = {};
    const database = {};

    sut = new UserController(
      serverConfig,
      database,
      userService,
      storageService,
      documentService,
      passwordResetRequestService,
      requestLimitRecordService,
      mailService,
      clientDataMappingService,
      roomService,
      pageRenderer
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetUserPage', () => {
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
        await expect(() => sut.handleGetUserPage(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the viewed user exists', () => {
      let documents;
      let mappedDocuments;
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

        documents = [{ _id: uniqueId.create() }];
        mappedDocuments = cloneDeep(documents);

        req = {
          user: viewingUser,
          params: { userId: viewedUser._id }
        };
        res = {};

        mappedViewedUser = cloneDeep(viewedUser);

        userService.getUserById.withArgs(viewedUser._id).resolves(viewedUser);
        documentService.getMetadataOfLatestPublicDocumentsCreatedByUser.withArgs(viewedUser._id).resolves(documents);

        clientDataMappingService.mapDocsOrRevisions.withArgs(documents).returns(mappedDocuments);
        clientDataMappingService.mapWebsitePublicUser.withArgs({ viewingUser, viewedUser }).returns(mappedViewedUser);
        pageRenderer.sendPage.resolves();

        return sut.handleGetUserPage(req, res);
      });

      it('should call pageRenderer.sendPage', () => {
        assert.calledWith(pageRenderer.sendPage, req, res, 'user', {
          user: mappedViewedUser,
          documents: mappedDocuments
        });
      });
    });
  });

  describe('handlePostUser', () => {
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

        userService.createUser.resolves({ result: SAVE_USER_RESULT.success, user: { verificationCode: 'verificationCode' } });
        clientDataMappingService.mapWebsiteUser.returns(mappedUser);

        sut.handlePostUser(req, res).catch(reject);
      }));

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call sendRegistrationVerificationEmail', () => {
        assert.calledWith(mailService.sendRegistrationVerificationEmail, {
          email: 'test@test.com',
          displayName: 'Test 1234',
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
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'localhost' },
          body: { email: 'test@test.com', password: 'abcd1234', displayName: 'Test 1234' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.createUser.resolves({ result: SAVE_USER_RESULT.duplicateEmail, user: null });

        sut.handlePostUser(req, res).catch(reject);
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
    let updatedUser;

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
        updatedUser = { ...updatedUser };

        userService.updateUserProfile.resolves(updatedUser);

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
        expect(response).toEqual({ user: updatedUser });
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
          body: { email: 'john.doe@gmail.com' }
        });
        res = httpMocks.createResponse({ eventEmitter: events.EventEmitter });

        res.on('end', resolve);

        userService.getActiveUserByEmailAddress.resolves(user);
        userService.createPasswordResetRequest.resolves({ _id: 'resetRequestId' });

        sut.handlePostUserPasswordResetRequest(req, res).catch(reject);
      }));

      it('should call userService.createPasswordResetRequest', () => {
        assert.calledWith(userService.createPasswordResetRequest, user);
      });

      it('should call mailService.sendPasswordResetEmail', () => {
        assert.calledWith(mailService.sendPasswordResetEmail, { email: user.email,
          displayName: user.displayName,
          completionLink: 'https://localhost/complete-password-reset/resetRequestId' });
      });

      it('should set the status code on the response to 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the result object', () => {
        const response = res._getData();
        expect(response).toEqual({});
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
});
