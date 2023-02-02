import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import StorageService from './storage-service.js';
import { assert, createSandbox, match } from 'sinon';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { ROLE, ROOM_DOCUMENTS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('storage-service', () => {
  const sandbox = createSandbox();

  let documentRevisionStore;
  let roomInvitationStore;
  let documentStore;
  let commentStore;
  let serverConfig;
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
    commentStore = container.get(CommentStore);
    serverConfig = container.get(ServerConfig);
    documentStore = container.get(DocumentStore);
    roomInvitationStore = container.get(RoomInvitationStore);
    documentRevisionStore = container.get(DocumentRevisionStore);

    db = container.get(Database);
    sut = container.get(StorageService);
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
    sandbox.stub(documentStore, 'deleteDocumentsByRoomId');
    sandbox.stub(documentStore, 'getDocumentById');
    sandbox.stub(documentStore, 'getDocumentsMetadataByRoomId');
    sandbox.stub(documentRevisionStore, 'deleteDocumentsByRoomId');
    sandbox.stub(documentStore, 'getDocumentsMetadataByConditions');
    sandbox.stub(roomStore, 'getRoomById');
    sandbox.stub(roomStore, 'deleteRoomById');
    sandbox.stub(roomStore, 'getRoomIdsByOwnerId');
    sandbox.stub(roomStore, 'getRoomsByOwnerOrCollaboratorUser');
    sandbox.stub(roomInvitationStore, 'deleteRoomInvitationsByRoomId');
    sandbox.stub(commentStore, 'deleteCommentsByDocumentIds');

    roomId = uniqueId.create();
    storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 10 * 1000 * 1000 };
    await db.storagePlans.insertOne(storagePlan);

    myUser = await setupTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getObjects', () => {
    let rooms;
    let result;
    let documents;

    beforeEach(async () => {
      sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.domain.com');
      documentStore.getDocumentsMetadataByConditions.resolves([]);
      roomStore.getRoomsByOwnerOrCollaboratorUser.resolves([]);

      cdn.listObjects.resolves([
        { prefix: null, name: 'document-media/34q87zc95t9c287eh/file-1.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' },
        { prefix: null, name: 'document-media/34q87zc95t9c287eh/file-2 with spaces.pdf', size: 2000, lastModified: '2022-06-09T12:00:00.000Z' },
        { prefix: null, name: 'document-media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf', size: 3000, lastModified: '2022-06-09T12:00:00.000Z' }
      ]);
      rooms = [];
      documents = [{ _id: '34q87zc95t9c287eh', title: 'Document title' }];

      roomStore.getRoomsByOwnerOrCollaboratorUser.withArgs({ userId: myUser._id }).resolves(rooms);
      documentStore.getDocumentsMetadataByConditions.withArgs([]).resolves(documents);

      result = await sut.getObjects({ parentPath: 'document-media/34q87zc95t9c287eh' });
    });

    it('should call the CDN', () => {
      assert.calledWith(cdn.listObjects, { prefix: 'document-media/34q87zc95t9c287eh/', recursive: false });
    });

    it('should construct all paths and URLs correctly', () => {
      expect(result).toStrictEqual([
        {
          displayName: 'file-1.pdf',
          parentPath: 'document-media/34q87zc95t9c287eh',
          path: 'document-media/34q87zc95t9c287eh/file-1.pdf',
          url: 'https://cdn.domain.com/document-media/34q87zc95t9c287eh/file-1.pdf',
          portableUrl: 'cdn://document-media/34q87zc95t9c287eh/file-1.pdf',
          createdOn: '2022-06-09T12:00:00.000Z',
          size: 1000
        },
        {
          displayName: 'file-2 with spaces.pdf',
          parentPath: 'document-media/34q87zc95t9c287eh',
          path: 'document-media/34q87zc95t9c287eh/file-2 with spaces.pdf',
          url: 'https://cdn.domain.com/document-media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
          portableUrl: 'cdn://document-media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
          createdOn: '2022-06-09T12:00:00.000Z',
          size: 2000
        },
        {
          displayName: 'file-3 with weird &$#=.pdf',
          parentPath: 'document-media/34q87zc95t9c287eh',
          path: 'document-media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf',
          url: 'https://cdn.domain.com/document-media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
          portableUrl: 'cdn://document-media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
          createdOn: '2022-06-09T12:00:00.000Z',
          size: 3000
        }
      ]);
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
      sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.domain.com');
    });

    describe('when the storage type is unknown', () => {
      beforeEach(async () => {
        parentPath = 'other-path';
        files = [{}];

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe(`Invalid storage path '${parentPath}'`);
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is document-media', () => {
      const id = 'xyz';
      const docId = uniqueId.create();

      let filesAfterUpload;

      beforeEach(async () => {
        parentPath = `document-media/${docId}`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        filesAfterUpload = [
          { name: `document-media/${docId}/file1-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `document-media/${docId}/file2-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        cdn.listObjects.withArgs({ prefix: `document-media/${docId}/`, recursive: true }).resolves(filesAfterUpload);
        cdn.listObjects.resolves([]);

        cdn.uploadObject.resolves();

        sandbox.stub(uniqueId, 'create').returns(id);
        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        assert.calledTwice(cdn.uploadObject);
        assert.calledWith(cdn.uploadObject, `document-media/${docId}/file1-${id}.jpeg`, files[0].path);
        assert.calledWith(cdn.uploadObject, `document-media/${docId}/file2-${id}.jpeg`, files[1].path);
      });

      it('should release the lock', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });

      it('should return zero used bytes', () => {
        expect(result).toEqual({ uploadedFiles: expect.any(Object), usedBytes: 0 });
      });

      it('should return the uploaded files', () => {
        expect(result).toEqual({
          uploadedFiles: {
            'file1.jpeg': {
              displayName: `file1-${id}.jpeg`,
              parentPath: `document-media/${docId}`,
              path: `document-media/${docId}/file1-${id}.jpeg`,
              url: `https://cdn.domain.com/document-media/${docId}/file1-${id}.jpeg`,
              portableUrl: `cdn://document-media/${docId}/file1-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              size: 3000000
            },
            'file2.jpeg': {
              displayName: `file2-${id}.jpeg`,
              parentPath: `document-media/${docId}`,
              path: `document-media/${docId}/file2-${id}.jpeg`,
              url: `https://cdn.domain.com/document-media/${docId}/file2-${id}.jpeg`,
              portableUrl: `cdn://document-media/${docId}/file2-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              size: 3000000
            }
          },
          usedBytes: expect.any(Number)
        });
      });
    });

    describe('when the storage type is room-media but the user has no storage plan allocated', () => {
      beforeEach(async () => {
        parentPath = `room-media/${roomId}`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        await db.users.updateOne(
          { _id: myUser._id },
          { $set: { storage: { planId: null, usedBytes: 0, reminders: [] } } }
        );

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Cannot upload to room-media storage without a storage plan');
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is room-media but the user has not enough storage space left', () => {
      beforeEach(async () => {
        parentPath = `room-media/${roomId}`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 5 * 1000 * 1000 },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 5 * 1000 * 1000 }
        ];

        myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Not enough storage space: available 8 MB, required 10 MB');
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is room-media and the user has enough storage space left', () => {
      const id = 'xyz';
      const otherRoomId = uniqueId.create();

      let filesInRoomBeforeUpload;
      let filesInRoomAfterUpload;
      let filesInOtherRoom;

      beforeEach(async () => {
        parentPath = `room-media/${roomId}`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInRoomBeforeUpload = [
          { name: `room-media/${roomId}/old-file-1-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `room-media/${roomId}/old-file-2-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInRoomAfterUpload = [
          ...filesInRoomBeforeUpload,
          { name: `room-media/${roomId}/file1-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `room-media/${roomId}/file2-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInOtherRoom = [{ name: `room-media/${otherRoomId}/old-file-3-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }];

        const usedBytes = [...filesInRoomBeforeUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { planId: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerId.resolves([roomId, otherRoomId]);
        cdn.listObjects.withArgs({ prefix: `room-media/${roomId}/`, recursive: true }).resolves(filesInRoomAfterUpload);
        cdn.listObjects.withArgs({ prefix: `room-media/${otherRoomId}/`, recursive: true }).resolves(filesInOtherRoom);
        cdn.listObjects.resolves([]);

        cdn.uploadObject.resolves();

        sandbox.stub(uniqueId, 'create').returns(id);
        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        assert.calledTwice(cdn.uploadObject);
        assert.calledWith(cdn.uploadObject, match(/room-media\/(.+)\/file1-(.+)\.jpeg/), files[0].path);
        assert.calledWith(cdn.uploadObject, match(/room-media\/(.+)\/file2-(.+)\.jpeg/), files[1].path);
      });

      it('should call cdn.listObjects for each room', () => {
        assert.calledWith(cdn.listObjects, { prefix: `room-media/${roomId}/`, recursive: true });
        assert.calledWith(cdn.listObjects, { prefix: `room-media/${otherRoomId}/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes)
          .toBe([...filesInRoomAfterUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0));
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });

      it('should return the recalculated used bytes', () => {
        expect(result).toEqual({
          uploadedFiles: expect.any(Object),
          usedBytes: [...filesInRoomAfterUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0)
        });
      });

      it('should return the uploaded files', () => {
        expect(result).toEqual({
          uploadedFiles: {
            'file1.jpeg': {
              displayName: `file1-${id}.jpeg`,
              parentPath: `room-media/${roomId}`,
              path: `room-media/${roomId}/file1-${id}.jpeg`,
              url: `https://cdn.domain.com/room-media/${roomId}/file1-${id}.jpeg`,
              portableUrl: `cdn://room-media/${roomId}/file1-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              size: 3000000
            },
            'file2.jpeg': {
              displayName: `file2-${id}.jpeg`,
              parentPath: `room-media/${roomId}`,
              path: `room-media/${roomId}/file2-${id}.jpeg`,
              url: `https://cdn.domain.com/room-media/${roomId}/file2-${id}.jpeg`,
              portableUrl: `cdn://room-media/${roomId}/file2-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              size: 3000000
            }
          },
          usedBytes: expect.any(Number)
        });
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
      path = 'other-path/file.jpeg';

      beforeEach(async () => {
        try {
          await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Invalid storage path \'other-path/\'');
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is document-media', () => {
      beforeEach(async () => {
        path = 'document-media/file.jpeg';

        myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        cdn.deleteObjects.resolves();
        roomStore.getRoomIdsByOwnerId.resolves([]);

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should not call roomStore.getRoomIdsByOwnerId', () => {
        assert.notCalled(roomStore.getRoomIdsByOwnerId);
      });

      it('should not call cdn.listObjects', () => {
        assert.notCalled(cdn.listObjects);
      });

      it('should not update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(myUser.storage.usedBytes);
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is room-media', () => {
      let allOwnedPrivateRoomIds;

      beforeEach(async () => {
        path = `room-media/${roomId}/file.jpeg`;

        files = [
          { size: 1 * 1000 * 1000 },
          { size: 1 * 1000 * 1000 },
          { name: `room-media/${roomId}/file.jpeg`, size: 1 * 1000 * 1000 }
        ];

        allOwnedPrivateRoomIds = [roomId, uniqueId.create()];

        const usedBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { planId: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerId.resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `room-media/${allOwnedPrivateRoomIds[0]}/`, recursive: true }).resolves([files[0]]);
        cdn.listObjects.withArgs({ prefix: `room-media/${allOwnedPrivateRoomIds[1]}/`, recursive: true }).resolves([files[1]]);

        cdn.deleteObjects.resolves();

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should call cdn.listObjects for each room', () => {
        assert.calledWith(cdn.listObjects, { prefix: `room-media/${allOwnedPrivateRoomIds[0]}/`, recursive: true });
        assert.calledWith(cdn.listObjects, { prefix: `room-media/${allOwnedPrivateRoomIds[1]}/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(files[0].size + files[1].size);
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });
  });

  describe('deleteRoomAndResources', () => {
    let lock;
    let roomDocuments;
    let remainingPrivateRoom;
    let filesFromRemainingPrivateRoom;

    beforeEach(async () => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();

      roomDocuments = [{ _id: uniqueId.create() }, { _id: uniqueId.create() }];
      documentStore.getDocumentsMetadataByRoomId.resolves(roomDocuments);

      documentStore.deleteDocumentsByRoomId.resolves();
      documentRevisionStore.deleteDocumentsByRoomId.resolves();
      roomInvitationStore.deleteRoomInvitationsByRoomId.resolves();
      roomStore.deleteRoomById.resolves();
      commentStore.deleteCommentsByDocumentIds.resolves();

      remainingPrivateRoom = { _id: uniqueId.create() };

      const filesFromRoomBeingDeleted = [
        { name: `room-media/${roomId}/file1`, size: 1 * 1000 * 1000 },
        { name: `room-media/${roomId}/file2`, size: 2 * 1000 * 1000 }
      ];

      filesFromRemainingPrivateRoom = [{ name: `room-media/${remainingPrivateRoom._id}/filex`, size: 3 * 1000 * 1000 }];

      cdn.listObjects.resolves([]);
      cdn.listObjects.withArgs({ prefix: `room-media/${roomId}/`, recursive: true }).resolves(filesFromRoomBeingDeleted);
      cdn.deleteObjects.resolves();
      roomStore.getRoomIdsByOwnerId.resolves([remainingPrivateRoom._id]);
      cdn.listObjects.withArgs({ prefix: `room-media/${remainingPrivateRoom._id}/`, recursive: true }).resolves(filesFromRemainingPrivateRoom);

      await sut.deleteRoomAndResources({ roomId, roomOwnerId: myUser._id });
    });

    it('should take the lock on the user record', () => {
      assert.calledWith(lockStore.takeUserLock, myUser._id);
    });

    it('should call documentStore.getDocumentsMetadataByRoomId', () => {
      assert.calledWith(documentStore.getDocumentsMetadataByRoomId, roomId, { session: match.object });
    });

    it('should call commentStore.deleteCommentsByDocumentIds', () => {
      assert.calledWith(commentStore.deleteCommentsByDocumentIds, roomDocuments.map(d => d._id), { session: match.object });
    });

    it('should call documentStore.deleteDocumentsByRoomId', () => {
      assert.calledWith(documentStore.deleteDocumentsByRoomId, roomId, { session: match.object });
    });

    it('should call documentRevisionStore.deleteDocumentsByRoomId', () => {
      assert.calledWith(documentRevisionStore.deleteDocumentsByRoomId, roomId, { session: match.object });
    });

    it('should call roomInvitationStore.deleteRoomInvitationsByRoomId', () => {
      assert.calledWith(roomInvitationStore.deleteRoomInvitationsByRoomId, roomId, { session: match.object });
    });

    it('should call roomStore.deleteRoomById', () => {
      assert.calledWith(roomStore.deleteRoomById, roomId, { session: match.object });
    });

    it('should call cdn.listObjects for the room being deleted', () => {
      assert.calledWith(cdn.listObjects, { prefix: `room-media/${roomId}/`, recursive: true });
    });

    it('should call cdn.deleteObjects', () => {
      assert.calledWith(cdn.deleteObjects, [`room-media/${roomId}/file1`, `room-media/${roomId}/file2`]);
    });

    it('should call roomStore.getRoomIdsByOwnerId', () => {
      assert.calledWith(roomStore.getRoomIdsByOwnerId, { ownerId: myUser._id });
    });

    it('should call cdn.listObjects for the remaining room', () => {
      assert.calledWith(cdn.listObjects, { prefix: `room-media/${remainingPrivateRoom._id}/`, recursive: true });
    });

    it('should update the user\'s usedBytes', async () => {
      const updatedUser = await db.users.findOne({ _id: myUser._id });
      expect(updatedUser.storage.usedBytes).toBe(filesFromRemainingPrivateRoom[0].size);
    });

    it('should release the lock', () => {
      assert.called(lockStore.releaseLock);
    });
  });

  describe('getStorageLocations', () => {
    let result;

    describe('when user is not provided', () => {
      beforeEach(async () => {
        documentStore.getDocumentById.resolves({});
        result = await sut.getStorageLocations({ documentId: 'documentId' });
      });
      it('should return empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when documentId is provided', () => {
      describe(`and the user has ${ROLE.user} role`, () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({});
          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the document media storage location with deletion disabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe(`and the user has ${ROLE.admin} role`, () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({});
          const myAdminUser = await setupTestUser(container, { roles: [ROLE.admin] });
          result = await sut.getStorageLocations({ user: myAdminUser, documentId: 'documentId' });
        });

        it('should return the document media storage location with deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

    describe('when documentId of a document in a room is provided', () => {
      describe('and the user is room owner and does not have a storage plan', () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { planId: null, usedBytes: 0, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the document media storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room owner and has a storage plan', () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the document and room media storage locations, with room-media storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.roomMedia,
              usedBytes: myUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              path: 'room-media/room',
              isDeletionEnabled: true
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner does not have a storage plan', () => {
        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            email: 'collaborator@test.com',
            displayName: 'collaborator'
          });
          const ownerUser = await setupTestUser(container, {
            email: 'owner@test.com',
            displayName: 'Owner'
          });

          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, documentId: 'documentId' });
        });

        it('should return the document media storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner has a storage plan', () => {
        let ownerUser;

        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            email: 'collaborator@test.com',
            displayName: 'Collaborator'
          });
          ownerUser = await setupTestUser(container, {
            email: 'owner@test.com',
            displayName: 'Owner',
            storage: { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] }
          });

          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, documentId: 'documentId' });
        });

        it('should return the document and room media storage locations, with room-media storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.documentMedia,
              path: 'document-media/documentId',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.roomMedia,
              usedBytes: ownerUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              path: 'room-media/room',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

  });

});
