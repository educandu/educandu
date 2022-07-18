/* eslint-disable max-lines */
import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import StorageService from './storage-service.js';
import LessonStore from '../stores/lesson-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';
import { CDN_OBJECT_TYPE, ROLE, ROOM_ACCESS, ROOM_DOCUMENTS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';

describe('storage-service', () => {
  const sandbox = sinon.createSandbox();

  let roomInvitationStore;
  let serverConfig;
  let lessonStore;
  let storagePlan;
  let roomStore;
  let lockStore;
  let container;
  let roomId;
  let myUser;
  let files;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    lockStore = container.get(LockStore);
    roomStore = container.get(RoomStore);
    lessonStore = container.get(LessonStore);
    serverConfig = container.get(ServerConfig);
    roomInvitationStore = container.get(RoomInvitationStore);

    sut = container.get(StorageService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.stub(cdn, 'listObjects');
    sandbox.stub(cdn, 'uploadObject');
    sandbox.stub(cdn, 'deleteObjects');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(lockStore, 'takeUserLock');
    sandbox.stub(lessonStore, 'deleteLessonsByRoomId');
    sandbox.stub(lessonStore, 'getLessonById');
    sandbox.stub(roomStore, 'getRoomById');
    sandbox.stub(roomStore, 'deleteRoomById');
    sandbox.stub(roomStore, 'getRoomIdsByOwnerIdAndAccess');
    sandbox.stub(roomInvitationStore, 'deleteRoomInvitationsByRoomId');

    roomId = uniqueId.create();
    storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 10 * 1000 * 1000 };
    await db.storagePlans.insertOne(storagePlan);

    myUser = await setupTestUser(container, { username: 'Me', email: 'i@myself.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getObjects', () => {
    beforeEach(() => {
      sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.domain.com');
    });

    describe('when neither the current directory nor the parent directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.withArgs({ prefix: 'media/34q87zc95t9c287eh/', recursive: true }).resolves([
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-1.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-2 with spaces.pdf', size: 2000, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf', size: 3000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);

        result = await sut.getObjects({ parentPath: 'media/34q87zc95t9c287eh', recursive: true });
      });
      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: {
            displayName: 'media',
            parentPath: '',
            path: 'media',
            url: 'https://cdn.domain.com/media',
            portableUrl: 'cdn://media',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          currentDirectory: {
            displayName: '34q87zc95t9c287eh',
            parentPath: 'media',
            path: 'media/34q87zc95t9c287eh',
            url: 'https://cdn.domain.com/media/34q87zc95t9c287eh',
            portableUrl: 'cdn://media/34q87zc95t9c287eh',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          objects: [
            {
              displayName: 'file-1.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-1.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-1.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-1.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000
            },
            {
              displayName: 'file-2 with spaces.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-2 with spaces.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 2000
            },
            {
              displayName: 'file-3 with weird &$#=.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 3000
            }
          ]
        });
      });
    });

    describe('when the parent directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.withArgs({ prefix: 'media/', recursive: true }).resolves([
          { prefix: 'media/34q87zc95t9c287eh/', name: null, size: null, lastModified: null },
          { prefix: 'media/43vzvjz05tzdfz7rf/', name: null, size: null, lastModified: null },
          { prefix: null, name: 'media/some-file.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);

        result = await sut.getObjects({ parentPath: 'media', recursive: true });
      });
      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: {
            displayName: '',
            parentPath: null,
            path: '',
            url: 'https://cdn.domain.com',
            portableUrl: 'cdn://',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          currentDirectory: {
            displayName: 'media',
            parentPath: '',
            path: 'media',
            url: 'https://cdn.domain.com/media',
            portableUrl: 'cdn://media',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          objects: [
            {
              displayName: '34q87zc95t9c287eh',
              parentPath: 'media',
              path: 'media/34q87zc95t9c287eh',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh',
              portableUrl: 'cdn://media/34q87zc95t9c287eh',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null
            },
            {
              displayName: '43vzvjz05tzdfz7rf',
              parentPath: 'media',
              path: 'media/43vzvjz05tzdfz7rf',
              url: 'https://cdn.domain.com/media/43vzvjz05tzdfz7rf',
              portableUrl: 'cdn://media/43vzvjz05tzdfz7rf',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null
            },
            {
              displayName: 'some-file.pdf',
              parentPath: 'media',
              path: 'media/some-file.pdf',
              url: 'https://cdn.domain.com/media/some-file.pdf',
              portableUrl: 'cdn://media/some-file.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000
            }
          ]
        });
      });
    });

    describe('when the current directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.withArgs({ prefix: '', recursive: true }).resolves([
          { prefix: 'media/', name: null, size: null, lastModified: null },
          { prefix: null, name: 'some-file.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);

        result = await sut.getObjects({ parentPath: '', recursive: true });
      });
      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: null,
          currentDirectory: {
            displayName: '',
            parentPath: null,
            path: '',
            url: 'https://cdn.domain.com',
            portableUrl: 'cdn://',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          objects: [
            {
              displayName: 'media',
              parentPath: '',
              path: 'media',
              url: 'https://cdn.domain.com/media',
              portableUrl: 'cdn://media',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null
            },
            {
              displayName: 'some-file.pdf',
              parentPath: '',
              path: 'some-file.pdf',
              url: 'https://cdn.domain.com/some-file.pdf',
              portableUrl: 'cdn://some-file.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000
            }
          ]
        });
      });
    });
  });

  describe('uploadFiles', () => {
    let lock;
    let result;
    let parentPath;

    beforeEach(() => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();
    });

    describe('when the storage type is unknown', () => {
      beforeEach(async () => {
        parentPath = 'other-path/media';
        files = [{}];

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe(`Invalid storage path '${parentPath}'`);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        parentPath = 'media';
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];
        cdn.uploadObject.resolves();

        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/media\/file1-(.+)\.jpeg/), files[0].path);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/media\/file2-(.+)\.jpeg/), files[1].path);
      });

      it('should release the lock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });

      it('should return zero used bytes', () => {
        expect(result).toEqual({ usedBytes: 0 });
      });
    });

    describe('when the storage type is private but the user has no storage plan allocated', () => {
      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        await db.users.updateOne(
          { _id: myUser._id },
          { $set: { storage: { plan: null, usedBytes: 0, reminders: [] } } }
        );

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Cannot upload to private storage without a storage plan');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private but the user has not enough storage space left', () => {
      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 5 * 1000 * 1000 },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 5 * 1000 * 1000 }
        ];

        myUser.storage = { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Not enough storage space: available 8 MB, required 10 MB');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private and the user has enough storage space left', () => {
      let allOwnedPrivateRoomIds;
      let oldFiles;

      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 3 * 1000 * 1000 },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 3 * 1000 * 1000 }
        ];

        oldFiles = [
          { size: 1 * 1000 * 1000 },
          { size: 1 * 1000 * 1000 }
        ];
        allOwnedPrivateRoomIds = [roomId, uniqueId.create()];

        const usedBytes = oldFiles.reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { plan: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerIdAndAccess.resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true }).resolves([oldFiles[0], files[0], files[1]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true }).resolves([oldFiles[1]]);
        cdn.listObjects.resolves([]);

        cdn.uploadObject.resolves();

        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file1-(.+)\.jpeg/), files[0].path);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file2-(.+)\.jpeg/), files[1].path);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes)
          .toBe(oldFiles[0].size + oldFiles[1].size + files[0].size + files[1].size);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });

      it('should return the recalculated used bytes', () => {
        expect(result).toEqual({ usedBytes: oldFiles[0].size + oldFiles[1].size + files[0].size + files[1].size });
      });
    });
  });

  describe('deleteObject', () => {
    let lock;
    let path;
    let result;

    beforeEach(() => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();
    });

    describe('when the storage type is unknown', () => {
      path = 'other-path/media/file.jpeg';

      beforeEach(async () => {
        try {
          await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Invalid storage path \'other-path/media/\'');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        path = 'media/file.jpeg';

        myUser.storage = { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        cdn.deleteObjects.resolves();
        roomStore.getRoomIdsByOwnerIdAndAccess.resolves([]);

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should not call roomStore.getRoomIdsByOwnerIdAndAccess', () => {
        sinon.assert.notCalled(roomStore.getRoomIdsByOwnerIdAndAccess);
      });

      it('should not call cdn.listObjects', () => {
        sinon.assert.notCalled(cdn.listObjects);
      });

      it('should not update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(myUser.storage.usedBytes);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private', () => {
      let allOwnedPrivateRoomIds;

      beforeEach(async () => {
        path = `rooms/${roomId}/media/file.jpeg`;

        files = [
          { size: 1 * 1000 * 1000 },
          { size: 1 * 1000 * 1000 },
          { name: `rooms/${roomId}/media/file.jpeg`, size: 1 * 1000 * 1000 }
        ];

        allOwnedPrivateRoomIds = [roomId, uniqueId.create()];

        const usedBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { plan: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerIdAndAccess.resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true }).resolves([files[0]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true }).resolves([files[1]]);

        cdn.deleteObjects.resolves();

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(files[0].size + files[1].size);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });
  });

  describe('deleteRoomAndResources', () => {
    let lock;
    let remainingPrivateRoom;
    let filesFromRemainingPrivateRoom;

    beforeEach(async () => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();

      lessonStore.deleteLessonsByRoomId.resolves();
      roomInvitationStore.deleteRoomInvitationsByRoomId.resolves();
      roomStore.deleteRoomById.resolves();

      remainingPrivateRoom = { _id: uniqueId.create() };

      const filesFromRoomBeingDeleted = [
        { name: `rooms/${roomId}/media/file1`, size: 1 * 1000 * 1000 },
        { name: `rooms/${roomId}/media/file2`, size: 2 * 1000 * 1000 }
      ];

      filesFromRemainingPrivateRoom = [{ name: `rooms/${remainingPrivateRoom._id}/media/filex`, size: 3 * 1000 * 1000 }];

      cdn.listObjects.resolves([]);
      cdn.listObjects.withArgs({ prefix: `rooms/${roomId}/media/`, recursive: true }).resolves(filesFromRoomBeingDeleted);
      cdn.deleteObjects.resolves();
      roomStore.getRoomIdsByOwnerIdAndAccess.resolves([remainingPrivateRoom._id]);
      cdn.listObjects.withArgs({ prefix: `rooms/${remainingPrivateRoom._id}/media/`, recursive: true }).resolves(filesFromRemainingPrivateRoom);

      await sut.deleteRoomAndResources({ roomId, roomOwnerId: myUser._id });
    });

    it('should take the lock on the user record', () => {
      sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
    });

    it('should call lessonStore.deleteLessonsByRoomId', () => {
      sinon.assert.calledWith(lessonStore.deleteLessonsByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call roomInvitationStore.deleteRoomInvitationsByRoomId', () => {
      sinon.assert.calledWith(roomInvitationStore.deleteRoomInvitationsByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call roomStore.deleteRoomById', () => {
      sinon.assert.calledWith(roomStore.deleteRoomById, roomId, { session: sinon.match.object });
    });

    it('should call cdn.listObjects for the room being deleted', () => {
      sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${roomId}/media/`, recursive: true });
    });

    it('should call cdn.deleteObjects', () => {
      sinon.assert.calledWith(cdn.deleteObjects, [`rooms/${roomId}/media/file1`, `rooms/${roomId}/media/file2`]);
    });

    it('should call roomStore.getRoomIdsByOwnerIdAndAccess', () => {
      sinon.assert.calledWith(roomStore.getRoomIdsByOwnerIdAndAccess, { ownerId: myUser._id, access: ROOM_ACCESS.private });
    });

    it('should call cdn.listObjects for the remaining private room', () => {
      sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${remainingPrivateRoom._id}/media/`, recursive: true });
    });

    it('should update the user\'s usedBytes', async () => {
      const updatedUser = await db.users.findOne({ _id: myUser._id });
      expect(updatedUser.storage.usedBytes).toBe(filesFromRemainingPrivateRoom[0].size);
    });

    it('should release the lock', () => {
      sinon.assert.called(lockStore.releaseLock);
    });
  });

  describe('getStorageLocations', () => {
    let result;

    describe('when user is not provided', () => {
      beforeEach(async () => {
        result = await sut.getStorageLocations({ documentId: 'document', lessonId: 'lesson' });
      });
      it('should return empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when documentId is provided', () => {
      describe(`and the user has ${ROLE.user} role`, () => {
        beforeEach(async () => {
          result = await sut.getStorageLocations({ user: myUser, documentId: 'document' });
        });

        it('should return the public storage location with deletion disabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/document',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe(`and the user has ${ROLE.admin} role`, () => {
        beforeEach(async () => {
          const myAdminUser = await setupTestUser(container, { roles: [ROLE.admin] });
          result = await sut.getStorageLocations({ user: myAdminUser, documentId: 'document' });
        });

        it('should return the public storage location with deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/document',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

    describe('when lessonId is provided', () => {
      describe('and the user is room owner and does not have a storage plan', () => {
        beforeEach(async () => {
          lessonStore.getLessonById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { plan: null, usedBytes: 0, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, documentId: 'document' });
        });

        it('should return the public storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/document',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room owner and has a storage plan', () => {
        beforeEach(async () => {
          lessonStore.getLessonById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, lessonId: 'lesson' });
        });

        it('should return the public and private storage locations, with private storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/lesson',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.private,
              usedBytes: myUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              rootPath: 'rooms/room/media',
              homePath: 'rooms/room/media',
              isDeletionEnabled: true
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner does not have a storage plan', () => {
        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            username: 'collaborator',
            email: 'collaborator@test.com'
          });
          const ownerUser = await setupTestUser(container, {
            username: 'owner',
            email: 'owner@test.com'
          });

          lessonStore.getLessonById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, lessonId: 'lesson' });
        });

        it('should return the public storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/lesson',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner has a storage plan', () => {
        let ownerUser;

        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            username: 'collaborator',
            email: 'collaborator@test.com'
          });
          ownerUser = await setupTestUser(container, {
            username: 'owner',
            email: 'owner@test.com',
            storage: { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] }
          });

          lessonStore.getLessonById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, lessonId: 'lesson' });
        });

        it('should return the public and private storage locations, with private storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/lesson',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.private,
              usedBytes: ownerUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              rootPath: 'rooms/room/media',
              homePath: 'rooms/room/media',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

  });

});
