import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import StorageController from './storage-controller.js';
import { ROOM_LESSONS_MODE } from '../domain/constants.js';

const { BadRequest, Unauthorized } = httpErrors;

describe('storage-controller', () => {
  const sandbox = sinon.createSandbox();

  let storageService;
  let roomService;

  let user;
  let room;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    storageService = {
      uploadFiles: sandbox.stub(),
      deleteObject: sandbox.stub()
    };
    roomService = {
      getRoomById: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    room = { _id: uniqueId.create() };

    roomService.getRoomById.resolves(null);
    roomService.getRoomById.withArgs(room._id).resolves(room);

    sut = new StorageController(storageService, roomService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostCdnObject', () => {
    describe('when no files are provided', () => {
      beforeEach(() => {
        req = { user, files: [], body: { prefix: 'media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { prefix: 'other-path/media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { prefix: 'rooms/some-room-id/media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but user is not the room owner or a collaborator', () => {
      beforeEach(() => {
        room.owner = uniqueId.create();
        room.members = [{ userId: uniqueId.create() }];
        room.lessonsMode = ROOM_LESSONS_MODE.collaborative;
        req = { user, files: [{}], body: { prefix: `rooms/${room._id}/media/` } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(done => {
        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];
        room.lessonsMode = ROOM_LESSONS_MODE.exclusive;
        req = { user, files: [{}], body: { prefix: `rooms/${room._id}/media/` } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        storageService.uploadFiles.resolves({ usedBytes: expectedUsedBytes });

        sut.handlePostCdnObject(req, res);
      });

      it('should call storageService.uploadFiles', () => {
        sinon.assert.calledWith(storageService.uploadFiles, { prefix: req.body.prefix, files: req.files, storageClaimingUserId: user._id });
      });

      it('should return 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: expectedUsedBytes });
      });
    });

    describe('when storage path type is private and the user is a room collaborator', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(done => {
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.lessonsMode = ROOM_LESSONS_MODE.collaborative;
        req = { user, files: [{}], body: { prefix: `rooms/${room._id}/media/` } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        storageService.uploadFiles.resolves({ usedBytes: expectedUsedBytes });

        sut.handlePostCdnObject(req, res);
      });

      it('should call storageService.uploadFiles (on behalf of the room owner)', () => {
        sinon.assert.calledWith(storageService.uploadFiles, { prefix: req.body.prefix, files: req.files, storageClaimingUserId: room.owner });
      });

      it('should return 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should return the used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: expectedUsedBytes });
      });
    });
  });

  describe('handleDeleteCdnObject', () => {
    describe('when storage path type is unknown', () => {
      beforeEach(() => {
        req = { user, query: { prefix: 'other-path/media/' }, params: { objectName: 'object-to-delete' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleDeleteCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, query: { prefix: 'rooms/some-room-id/media/' }, params: { objectName: 'object-to-delete' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleDeleteCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but user is not the room owner or a collaborator', () => {
      beforeEach(() => {
        room.owner = uniqueId.create();
        room.members = [{ userId: uniqueId.create() }];
        room.lessonsMode = ROOM_LESSONS_MODE.collaborative;
        req = { user, query: { prefix: `rooms/${room._id}/media/` }, params: { objectName: 'object-to-delete' } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleDeleteCdnObject(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(done => {
        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];
        room.lessonsMode = ROOM_LESSONS_MODE.exclusive;
        req = { user, query: { prefix: `rooms/${room._id}/media/` }, params: { objectName: 'object-to-delete' } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        storageService.deleteObject.resolves({ usedBytes: expectedUsedBytes });

        sut.handleDeleteCdnObject(req, res);
      });

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(storageService.deleteObject, { prefix: req.query.prefix, objectName: req.params.objectName, storageClaimingUserId: user._id });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: expectedUsedBytes });
      });
    });

    describe('when storage path type is private and the user a room collaborator', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(done => {
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.lessonsMode = ROOM_LESSONS_MODE.collaborative;
        req = { user, query: { prefix: `rooms/${room._id}/media/` }, params: { objectName: 'object-to-delete' } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        storageService.deleteObject.resolves({ usedBytes: expectedUsedBytes });

        sut.handleDeleteCdnObject(req, res);
      });

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(
          storageService.deleteObject,
          { prefix: req.query.prefix, objectName: req.params.objectName, storageClaimingUserId: room.owner }
        );
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: expectedUsedBytes });
      });
    });

    describe('when storage path type is public', () => {
      beforeEach(done => {
        room.owner = user._id;
        room.lessonsMode = ROOM_LESSONS_MODE.collaborative;
        req = { user, query: { prefix: 'media/' }, params: { objectName: 'object-to-delete' } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        storageService.deleteObject.resolves({ usedBytes: 0 });

        sut.handleDeleteCdnObject(req, res);
      });

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(storageService.deleteObject, { prefix: req.query.prefix, objectName: req.params.objectName, storageClaimingUserId: user._id });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return 0 used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: 0 });
      });
    });
  });
});
