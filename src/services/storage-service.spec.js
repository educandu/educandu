import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import StorageService from './storage-service.js';
import LessonStore from '../stores/lesson-store.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('storage-service', () => {
  const sandbox = sinon.createSandbox();

  let roomInvitationStore;
  let lessonStore;
  let storagePlan;
  let roomStore;
  let container;
  let prefix;
  let roomId;
  let myUser;
  let files;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    roomStore = container.get(RoomStore);
    lessonStore = container.get(LessonStore);
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
    sandbox.stub(lessonStore, 'deleteLessonsByRoomId');
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

  describe('uploadFiles', () => {
    describe('when the storage type is unknown', () => {
      beforeEach(() => {
        prefix = 'other-path/media/';
        files = [{}];
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user: myUser }))
          .rejects.toThrowError(`Invalid storage path '${prefix}'`);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        prefix = 'media/';
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];
        cdn.uploadObject.resolves();

        await sut.uploadFiles({ prefix, files, user: myUser });
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/media\/file1-(.+)\.jpeg/), files[0].path, {});
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/media\/file2-(.+)\.jpeg/), files[1].path, {});
      });
    });

    describe('when the storage type is private but the user has no storage plan allocated', () => {
      beforeEach(async () => {
        prefix = `rooms/${roomId}/media/`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        await db.users.updateOne(
          { _id: myUser._id },
          { $set: { storage: { plan: null, usedBytes: 0, reminders: [] } } }
        );
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user: myUser }))
          .rejects.toThrowError('Cannot upload to private storage without a storage plan');
      });
    });

    describe('when the storage type is private but the user has not enough storage space left', () => {
      beforeEach(async () => {
        prefix = `rooms/${roomId}/media/`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 5 * 1000 * 1000 },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 5 * 1000 * 1000 }
        ];

        myUser.storage = { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user: myUser }))
          .rejects.toThrowError('Not enough storage space: available 8 MB, required 10 MB');
      });
    });

    describe('when the storage type is private and the user has enough storage space left', () => {
      let allOwnedPrivateRoomIds;
      let oldFiles;

      beforeEach(async () => {
        prefix = `rooms/${roomId}/media/`;
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

        await sut.uploadFiles({ prefix, files, user: myUser });
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file1-(.+)\.jpeg/), files[0].path, {});
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file2-(.+)\.jpeg/), files[1].path, {});
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
    });
  });

  describe('deleteObject', () => {
    let fileToDelete;

    describe('when the storage type is unknown', () => {
      beforeEach(() => {
        prefix = 'other-path/media/';
        fileToDelete = { name: 'file1.jpeg' };
      });

      it('should throw an error', async () => {
        await expect(() => sut.deleteObject({ prefix, objectName: fileToDelete.name, userId: myUser._id }))
          .rejects.toThrowError(`Invalid storage path '${prefix}'`);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        prefix = 'media/';
        fileToDelete = { name: 'file.jpeg' };

        myUser.storage = { plan: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        cdn.deleteObjects.resolves();
        roomStore.getRoomIdsByOwnerIdAndAccess.resolves([]);

        await sut.deleteObject({ prefix, objectName: fileToDelete.name, userId: myUser._id });
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [`${prefix}${fileToDelete.name}`]);
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
    });

    describe('when the storage type is private', () => {
      let allOwnedPrivateRoomIds;

      beforeEach(async () => {
        prefix = `rooms/${roomId}/media/`;
        fileToDelete = { name: 'file.jpeg', size: 1 * 1000 * 1000 };

        files = [
          { size: 1 * 1000 * 1000 },
          { size: 1 * 1000 * 1000 },
          fileToDelete
        ];
        allOwnedPrivateRoomIds = [roomId, uniqueId.create()];

        const usedBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { plan: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerIdAndAccess.resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true }).resolves([files[0]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true }).resolves([files[1]]);

        cdn.deleteObjects.resolves();

        await sut.deleteObject({ prefix, objectName: fileToDelete.name, userId: myUser._id });
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [`${prefix}${fileToDelete.name}`]);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(files[0].size + files[1].size);
      });
    });
  });

  describe('deleteRoomAndResources', () => {
    let remainingPrivateRoom;
    let filesFromRemainingPrivateRoom;

    beforeEach(async () => {
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
      sinon.assert.calledWith(roomStore.getRoomIdsByOwnerIdAndAccess, { ownerId: myUser._id, access: ROOM_ACCESS_LEVEL.private });
    });

    it('should call cdn.listObjects for the remaining private room', () => {
      sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${remainingPrivateRoom._id}/media/`, recursive: true });
    });

    it('should update the user\'s usedBytes', async () => {
      const updatedUser = await db.users.findOne({ _id: myUser._id });
      expect(updatedUser.storage.usedBytes).toBe(filesFromRemainingPrivateRoom[0].size);
    });
  });

});
