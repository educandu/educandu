import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import CdnService from './cdn-service.js';
import RoomService from './room-service.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('cdn-service', () => {
  const sandbox = sinon.createSandbox();

  let storagePlan;
  let roomService;
  let container;
  let prefix;
  let roomId;
  let files;
  let user;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    roomService = container.get(RoomService);

    sut = container.get(CdnService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.stub(cdn, 'listObjects');
    sandbox.stub(cdn, 'uploadObject');
    sandbox.stub(cdn, 'deleteObject');
    sandbox.stub(roomService, 'getIdsOfPrivateRoomsOwnedByUser');

    roomId = uniqueId.create();
    storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxSizeInBytes: 10 * 1000 * 1000 };
    await db.storagePlans.insertOne(storagePlan);

    user = await setupTestUser(container, { username: 'Me', email: 'i@myself.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('uploadFiles', () => {
    describe('when the storage type is unknown', () => {
      beforeEach(() => {
        prefix = 'other-path/media';
        files = [{}];
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user }))
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

        await sut.uploadFiles({ prefix, files, user });
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
          { _id: user._id },
          { $set: { storage: { plan: null, usedStorageInBytes: 0, reminders: [] } } }
        );
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user }))
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

        user.storage = { plan: storagePlan._id, usedStorageInBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: user._id }, { $set: { storage: user.storage } });
      });

      it('should throw an error', async () => {
        await expect(() => sut.uploadFiles({ prefix, files, user }))
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

        const usedStorageInBytes = oldFiles.reduce((totalSize, file) => totalSize + file.size, 0);
        user.storage = { plan: storagePlan._id, usedStorageInBytes, reminders: [] };
        await db.users.updateOne({ _id: user._id }, { $set: { storage: user.storage } });

        roomService.getIdsOfPrivateRoomsOwnedByUser.withArgs(user._id).resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/` }).resolves([oldFiles[0], files[0], files[1]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/` }).resolves([oldFiles[1]]);

        cdn.uploadObject.resolves();

        await sut.uploadFiles({ prefix, files, user });
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file1-(.+)\.jpeg/), files[0].path, {});
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file2-(.+)\.jpeg/), files[1].path, {});
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/` });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/` });
      });

      it('should update the user\'s usedStorageInBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: user._id });
        expect(updatedUser.storage.usedStorageInBytes)
          .toBe(oldFiles[0].size + oldFiles[1].size + files[0].size + files[1].size);
      });
    });
  });

  describe('deleteObject', () => {
    let fileToDelete;

    describe('when the storage type is unknown', () => {
      beforeEach(() => {
        prefix = 'other-path/media';
        fileToDelete = { name: 'file1.jpeg' };
      });

      it('should throw an error', async () => {
        await expect(() => sut.deleteObject({ prefix, objectName: fileToDelete.name, user }))
          .rejects.toThrowError(`Invalid storage path '${prefix}'`);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        prefix = 'media/';
        fileToDelete = { name: 'file.jpeg' };

        user.storage = { plan: storagePlan._id, usedStorageInBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: user._id }, { $set: { storage: user.storage } });

        cdn.deleteObject.resolves();

        await sut.deleteObject({ prefix, objectName: fileToDelete.name, user });
      });

      it('should call cdn.deleteObject', () => {
        sinon.assert.calledWith(cdn.deleteObject, `${prefix}${fileToDelete.name}`);
      });

      it('should not call cdn.listObjects', () => {
        sinon.assert.notCalled(cdn.listObjects);
      });

      it('should not update the user\'s usedStorageInBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: user._id });
        expect(updatedUser.storage.usedStorageInBytes).toBe(user.storage.usedStorageInBytes);
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

        const usedStorageInBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
        user.storage = { plan: storagePlan._id, usedStorageInBytes, reminders: [] };
        await db.users.updateOne({ _id: user._id }, { $set: { storage: user.storage } });

        roomService.getIdsOfPrivateRoomsOwnedByUser.withArgs(user._id).resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/` }).resolves([files[0]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/` }).resolves([files[1]]);

        cdn.deleteObject.resolves();

        await sut.deleteObject({ prefix, objectName: fileToDelete.name, user });
      });

      it('should call cdn.deleteObject', () => {
        sinon.assert.calledWith(cdn.deleteObject, `${prefix}${fileToDelete.name}`);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/` });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/` });
      });

      it('should update the user\'s usedStorageInBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: user._id });
        expect(updatedUser.storage.usedStorageInBytes).toBe(files[0].size + files[1].size);
      });
    });
  });
});
