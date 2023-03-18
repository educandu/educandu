import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import { assert, createSandbox, match } from 'sinon';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import StoragePlanService from './storage-plan-service.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, createTestUser } from '../test-helper.js';

describe('storage-plan-service', () => {
  const sandbox = createSandbox();

  let documentRevisionStore;
  let roomInvitationStore;
  let documentStore;
  let commentStore;
  let storagePlan;
  let roomStore;
  let lockStore;
  let container;
  let roomId;
  let myUser;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    lockStore = container.get(LockStore);
    roomStore = container.get(RoomStore);
    commentStore = container.get(CommentStore);
    documentStore = container.get(DocumentStore);
    roomInvitationStore = container.get(RoomInvitationStore);
    documentRevisionStore = container.get(DocumentRevisionStore);

    db = container.get(Database);
    sut = container.get(StoragePlanService);
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

    myUser = await createTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('deleteRoom', () => {
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

      await sut.deleteRoom({ roomId, roomOwnerId: myUser._id });
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

});
