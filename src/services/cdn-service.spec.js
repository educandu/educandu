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

        user.storage = { plan: storagePlan._id, usedStorageInBytes: oldFiles[0].size + oldFiles[1].size, reminders: [] };
        await db.users.updateOne({ _id: user._id }, { $set: { storage: user.storage } });

        cdn.uploadObject.resolves();
        roomService.getIdsOfPrivateRoomsOwnedByUser.withArgs(user._id).resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/` })
          .resolves([
            { size: oldFiles[0].size },
            { size: files[0].size },
            { size: files[1].size }
          ]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/` })
          .resolves([{ size: oldFiles[1].size }]);

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
});
