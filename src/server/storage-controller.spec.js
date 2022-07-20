import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import StorageController from './storage-controller.js';
import { ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

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
      getObjects: sandbox.stub(),
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

  describe('handleGetCdnObjects', () => {
    describe('when storage path type is unknown', () => {
      beforeEach(() => {
        req = { user, query: { parentPath: 'other-path/media' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleGetCdnObjects(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, query: { parentPath: 'rooms/some-room-id/media' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleGetCdnObjects(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but user is not the room owner or a collaborator', () => {
      beforeEach(() => {
        room.owner = uniqueId.create();
        room.members = [{ userId: uniqueId.create() }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, query: { parentPath: `rooms/${room._id}/media` } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleGetCdnObjects(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      let parentDirectory;
      let currentDirectory;
      let objects;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        parentDirectory = `rooms/${room._id}`;
        currentDirectory = `rooms/${room._id}/media`;
        objects = [];
        req = { user, query: { parentPath: currentDirectory } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.getObjects.resolves({ parentDirectory, currentDirectory, objects });

        sut.handleGetCdnObjects(req, res).catch(reject);
      }));

      it('should call storageService.getObjects', () => {
        sinon.assert.calledWith(storageService.getObjects, {
          parentPath: currentDirectory,
          searchTerm: null,
          recursive: false
        });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the objects', () => {
        expect(res._getData()).toEqual({ parentDirectory, currentDirectory, objects });
      });
    });

    describe('when storage path type is private and the user is a room collaborator', () => {
      let parentDirectory;
      let currentDirectory;
      let objects;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        parentDirectory = `rooms/${room._id}`;
        currentDirectory = `rooms/${room._id}/media`;
        objects = [];
        req = { user, query: { parentPath: currentDirectory } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.getObjects.resolves({ parentDirectory, currentDirectory, objects });

        sut.handleGetCdnObjects(req, res).catch(reject);
      }));

      it('should call storageService.getObjects', () => {
        sinon.assert.calledWith(storageService.getObjects, {
          parentPath: currentDirectory,
          searchTerm: null,
          recursive: false
        });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the objects', () => {
        expect(res._getData()).toEqual({ parentDirectory, currentDirectory, objects });
      });
    });

    describe('when storage path type is public', () => {
      let parentDirectory;
      let currentDirectory;
      let objects;

      beforeEach(() => new Promise((resolve, reject) => {
        parentDirectory = '';
        currentDirectory = 'media';
        objects = [];
        req = { user, query: { parentPath: currentDirectory } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.getObjects.resolves({ parentDirectory, currentDirectory, objects });

        sut.handleGetCdnObjects(req, res).catch(reject);
      }));

      it('should call storageService.getObjects', () => {
        sinon.assert.calledWith(storageService.getObjects, {
          parentPath: currentDirectory,
          searchTerm: null,
          recursive: false
        });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the objects', () => {
        expect(res._getData()).toEqual({ parentDirectory, currentDirectory, objects });
      });
    });
  });

  describe('handlePostCdnObject', () => {
    describe('when no files are provided', () => {
      beforeEach(() => {
        req = { user, files: [], body: { parentPath: 'media' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { parentPath: 'other-path/media' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { parentPath: 'rooms/some-room-id/media' } };
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
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, files: [{}], body: { parentPath: `rooms/${room._id}/media` } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        req = { user, files: [{}], body: { parentPath: `rooms/${room._id}/media` } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.uploadFiles.resolves({ usedBytes: expectedUsedBytes });

        sut.handlePostCdnObject(req, res).catch(reject);
      }));

      it('should call storageService.uploadFiles', () => {
        sinon.assert.calledWith(storageService.uploadFiles, {
          parentPath: `rooms/${room._id}/media`,
          files: req.files,
          storageClaimingUserId: user._id
        });
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

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, files: [{}], body: { parentPath: `rooms/${room._id}/media` } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.uploadFiles.resolves({ usedBytes: expectedUsedBytes });

        sut.handlePostCdnObject(req, res).catch(reject);
      }));

      it('should call storageService.uploadFiles (on behalf of the room owner)', () => {
        sinon.assert.calledWith(storageService.uploadFiles, {
          parentPath: `rooms/${room._id}/media`,
          files: req.files,
          storageClaimingUserId: room.owner
        });
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
        req = { user, query: { path: 'other-path/media/object-to-delete' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleDeleteCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, query: { path: 'rooms/some-room-id/media/object-to-delete' } };
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
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, query: { path: `rooms/${room._id}/media/object-to-delete` } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleDeleteCdnObject(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      const expectedUsedBytes = 2 * 1000 * 1000;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        req = { user, query: { path: `rooms/${room._id}/media/object-to-delete` } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.deleteObject.resolves({ usedBytes: expectedUsedBytes });

        sut.handleDeleteCdnObject(req, res).catch(reject);
      }));

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(storageService.deleteObject, {
          path: `rooms/${room._id}/media/object-to-delete`,
          storageClaimingUserId: user._id
        });
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

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, query: { path: `rooms/${room._id}/media/object-to-delete` } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.deleteObject.resolves({ usedBytes: expectedUsedBytes });

        sut.handleDeleteCdnObject(req, res).catch(reject);
      }));

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(storageService.deleteObject, {
          path: `rooms/${room._id}/media/object-to-delete`,
          storageClaimingUserId: room.owner
        });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the used bytes', () => {
        expect(res._getData()).toEqual({ usedBytes: expectedUsedBytes });
      });
    });

    describe('when storage path type is public', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        req = { user, query: { path: 'media/object-to-delete' } };

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        storageService.deleteObject.resolves({ usedBytes: 0 });

        sut.handleDeleteCdnObject(req, res).catch(reject);
      }));

      it('should call storageService.deleteObject', () => {
        sinon.assert.calledWith(storageService.deleteObject, {
          path: 'media/object-to-delete',
          storageClaimingUserId: user._id
        });
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
