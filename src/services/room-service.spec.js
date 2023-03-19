import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import RoomService from './room-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import cloneDeep from '../utils/clone-deep.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import UserStore from '../stores/user-store.js';
import { assert, createSandbox, match } from 'sinon';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import { INVALID_ROOM_INVITATION_REASON } from '../domain/constants.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser,
  createTestRoom,
  createTestDocument
} from '../test-helper.js';

const { BadRequest, NotFound } = httpErrors;

describe('room-service', () => {
  let documentRevisionStore;
  let roomInvitationStore;
  let documentStore;
  let commentStore;
  let roomStore;
  let userStore;
  let lockStore;
  let container;
  let otherUser;
  let myUser;
  let cdn;
  let sut;
  let db;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    lockStore = container.get(LockStore);
    roomStore = container.get(RoomStore);
    userStore = container.get(UserStore);
    commentStore = container.get(CommentStore);
    documentStore = container.get(DocumentStore);
    roomInvitationStore = container.get(RoomInvitationStore);
    documentRevisionStore = container.get(DocumentRevisionStore);

    db = container.get(Database);
    sut = container.get(RoomService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(lockStore, 'takeUserLock');
    sandbox.stub(lockStore, 'takeRoomLock');

    sandbox.useFakeTimers(now);

    myUser = await createTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
    otherUser = await createTestUser(container, { email: 'goofy@ducktown.com', displayName: 'Goofy' });
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('createRoom', () => {
    let result;

    beforeEach(async () => {
      result = await sut.createRoom({
        name: 'my room',
        slug: '  my-room  ',
        isCollaborative: false,
        user: myUser
      });
    });

    it('should create a room', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        slug: 'my-room',
        owner: myUser._id,
        isCollaborative: false,
        description: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        members: [],
        messages: [],
        documents: []
      });
    });

    it('should write it to the database', async () => {
      const retrievedRoom = await roomStore.getRoomById(result._id);
      expect(retrievedRoom).toEqual(result);
    });
  });

  describe('deleteRoom', () => {
    let room;
    let userLock;
    let roomDocuments;
    let roomMediaOverviewAfterDeletion;

    beforeEach(async () => {
      room = { _id: uniqueId.create() };
      userLock = { id: uniqueId.create() };
      roomDocuments = [{ _id: uniqueId.create() }, { _id: uniqueId.create() }];
      roomMediaOverviewAfterDeletion = { usedBytes: 100 };

      lockStore.takeUserLock.resolves(userLock);
      lockStore.releaseLock.resolves();

      sandbox.stub(documentStore, 'getDocumentsMetadataByRoomId').resolves(roomDocuments);
      sandbox.stub(commentStore, 'deleteCommentsByDocumentIds').resolves();
      sandbox.stub(documentRevisionStore, 'deleteDocumentsByRoomId').resolves();
      sandbox.stub(documentStore, 'deleteDocumentsByRoomId').resolves();
      sandbox.stub(roomInvitationStore, 'deleteRoomInvitationsByRoomId').resolves();
      sandbox.stub(roomStore, 'deleteRoomById').resolves();
      sandbox.stub(cdn, 'deleteDirectory').resolves();
      sandbox.stub(sut, 'getRoomMediaOverview').resolves(roomMediaOverviewAfterDeletion);
      sandbox.stub(userStore, 'updateUserUsedBytes').resolves(cloneDeep(myUser));

      await sut.deleteRoom({ room, roomOwner: myUser });
    });

    it('should take the lock on the user record', () => {
      assert.calledWith(lockStore.takeUserLock, myUser._id);
    });

    it('should call documentStore.getDocumentsMetadataByRoomId', () => {
      assert.calledWith(documentStore.getDocumentsMetadataByRoomId, room._id, { session: match.object });
    });

    it('should call commentStore.deleteCommentsByDocumentIds', () => {
      assert.calledWith(commentStore.deleteCommentsByDocumentIds, roomDocuments.map(d => d._id), { session: match.object });
    });

    it('should call documentStore.deleteDocumentsByRoomId', () => {
      assert.calledWith(documentStore.deleteDocumentsByRoomId, room._id, { session: match.object });
    });

    it('should call documentRevisionStore.deleteDocumentsByRoomId', () => {
      assert.calledWith(documentRevisionStore.deleteDocumentsByRoomId, room._id, { session: match.object });
    });

    it('should call roomInvitationStore.deleteRoomInvitationsByRoomId', () => {
      assert.calledWith(roomInvitationStore.deleteRoomInvitationsByRoomId, room._id, { session: match.object });
    });

    it('should call roomStore.deleteRoomById', () => {
      assert.calledWith(roomStore.deleteRoomById, room._id, { session: match.object });
    });

    it('should call cdn.deleteDirectory for the room being deleted', () => {
      assert.calledWith(cdn.deleteDirectory, { directoryPath: `room-media/${room._id}` });
    });

    it('should call userStore.updateUserUsedBytes', () => {
      assert.calledWith(userStore.updateUserUsedBytes, { userId: myUser._id, usedBytes: roomMediaOverviewAfterDeletion.usedBytes });
    });

    it('should release the lock', () => {
      assert.called(lockStore.releaseLock);
    });
  });

  describe('createOrUpdateInvitations', () => {
    let room = null;

    beforeEach(async () => {
      room = await sut.createRoom({
        name: 'my room',
        isCollaborative: false,
        user: myUser
      });
    });

    it('should create a new invitation for a room if it does not exist', async () => {
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], user: myUser });
      expect(invitations[0].token).toBeDefined();
    });

    it('should throw a bad request if the owner invites themselves', async () => {
      await expect(() => sut.createOrUpdateInvitations({ roomId: room._id, emails: [myUser.email], user: myUser })).rejects.toThrow(BadRequest);
    });

    it('should update an invitation if it already exists', async () => {
      const { invitations: originalInvitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], user: myUser });
      sandbox.clock.tick(1000);
      const { invitations: updatedInvitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], user: myUser });
      expect(updatedInvitations[0]._id).toBe(originalInvitations[0]._id);
      expect(updatedInvitations[0].token).toBe(originalInvitations[0].token);
      expect(updatedInvitations[0].sentOn).not.toBe(originalInvitations[0].sentOn);
      expect(updatedInvitations[0].expiresOn.getTime()).toBeGreaterThan(originalInvitations[0].expiresOn.getTime());
    });

    it('should throw a NotFound error when the room does not exist', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitations({ roomId: 'abcabcabcabcabc', emails: ['invited-user@test.com'], user: myUser });
      }).rejects.toThrow(NotFound);
    });

    it('should throw a NotFound error when the room exists, but belongs to a different user', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitations({ roomId: 'abcabcabcabcabc', emails: ['invited-user@test.com'], user: { _id: 'xyzxyzxyzxyzxyz' } });
      }).rejects.toThrow(NotFound);
    });
  });

  describe('verifyInvitationToken', () => {
    let testRoom = null;
    let invitation = null;

    beforeEach(async () => {
      testRoom = await sut.createRoom({
        name: 'room-name',
        slug: 'room-slug',
        isCollaborative: false,
        user: myUser
      });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], user: myUser });
      invitation = invitations[0];
    });

    it('should be valid if user and token are valid', async () => {
      const { roomId, roomName, roomSlug, invalidInvitationReason } = await sut.verifyInvitationToken({ token: invitation.token, user: otherUser });
      expect(invalidInvitationReason).toBe(null);
      expect(roomId).toBe(testRoom._id);
      expect(roomName).toBe(testRoom.name);
      expect(roomSlug).toBe(testRoom.slug);
    });

    it('should be invalid if user is valid but token is invalid', async () => {
      const { roomId, roomName, roomSlug, invalidInvitationReason } = await sut.verifyInvitationToken({ token: '34z5c7z47z92234z592qz', user: otherUser });
      expect(invalidInvitationReason).toBe(INVALID_ROOM_INVITATION_REASON.token);
      expect(roomId).toBeNull();
      expect(roomName).toBeNull();
      expect(roomSlug).toBeNull();
    });

    it('should be invalid if token is valid but user is invalid', async () => {
      const { roomId, roomName, roomSlug, invalidInvitationReason } = await sut.verifyInvitationToken({ token: invitation.token, user: myUser });
      expect(invalidInvitationReason).toBe(INVALID_ROOM_INVITATION_REASON.user);
      expect(roomId).toBeNull();
      expect(roomName).toBeNull();
      expect(roomSlug).toBeNull();
    });
  });

  describe('confirmInvitation', () => {
    let testRoom = null;
    let invitation = null;

    beforeEach(async () => {
      testRoom = await sut.createRoom({
        name: 'test-room',
        isCollaborative: false,
        user: myUser
      });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], user: myUser });
      invitation = invitations[0];
    });

    it('should throw NotFound if invitation does not exist', async () => {
      await expect(async () => {
        await sut.confirmInvitation({ token: '34z5c7z47z92234z592qz', user: otherUser });
      }).rejects.toThrow(NotFound);
    });

    it('should throw NotFound if the email is not the email used in the invitation', async () => {
      await expect(async () => {
        await sut.confirmInvitation({ token: invitation.token, user: { ...otherUser, email: 'changed@test.com' } });
      }).rejects.toThrow(NotFound);
    });

    describe('when user and token are valid', () => {
      const lock = { key: 'room' };

      beforeEach(async () => {
        lockStore.takeRoomLock.resolves(lock);
        lockStore.releaseLock.resolves();
        await sut.confirmInvitation({ token: invitation.token, user: otherUser });
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, invitation.roomId);
      });

      it('should release the lock on the room', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });

      it('should add the user as a room member if user and token are valid', async () => {
        const roomFromDb = await db.rooms.findOne({ _id: testRoom._id });

        expect(roomFromDb.members).toEqual([
          {
            userId: otherUser._id,
            joinedOn: expect.any(Date)
          }
        ]);
      });

      it('should remove the invitation from the database', async () => {
        const invitationFromDb = await db.roomInvitations.findOne({ _id: invitation._id });
        expect(invitationFromDb).toBeNull();
      });

      describe('and the user gets invited a second time', () => {
        let existingMemberJoinedOn;

        beforeEach(async () => {
          const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], user: myUser });
          invitation = invitations[0];

          const roomFromDb = await db.rooms.findOne({ _id: testRoom._id });
          existingMemberJoinedOn = roomFromDb.members[0].joinedOn;

          await sut.confirmInvitation({ token: invitation.token, user: otherUser });
        });

        it('should not add the user user a second time', async () => {
          const roomFromDb = await db.rooms.findOne({ _id: testRoom._id });

          expect(roomFromDb.members).toEqual([
            {
              userId: otherUser._id,
              joinedOn: existingMemberJoinedOn
            }
          ]);
        });

        it('should remove the invitation from the database', async () => {
          const invitationFromDb = await db.roomInvitations.findOne({ _id: invitation._id });
          expect(invitationFromDb).toBeNull();
        });
      });
    });
  });

  describe('getRoomInvitations', () => {
    let testRoom = null;
    let invitation = null;

    beforeEach(async () => {
      testRoom = await sut.createRoom({
        name: 'test-room',
        isCollaborative: false,
        user: myUser
      });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], user: myUser });
      invitation = invitations[0];
    });

    it('should retrieve the invitation', async () => {
      delete invitation.roomId;
      delete invitation.token;

      const invitations = await sut.getRoomInvitations(testRoom._id);
      expect(invitations).toEqual([invitation]);
    });
  });

  describe('updateRoomDocumentsOrder', () => {
    let lock;
    let result;
    let roomId;
    let document1;
    let document2;
    let document3;

    beforeEach(async () => {
      lock = { key: 'room' };
      roomId = uniqueId.create();
      const room = {
        _id: roomId,
        name: 'my room',
        slug: 'my-slug',
        description: '',
        isCollaborative: false,
        createdBy: myUser._id,
        createdOn: new Date(),
        updatedOn: new Date(),
        owner: myUser._id,
        members: [],
        messages: [],
        documents: []
      };

      await roomStore.saveRoom(room);
      document1 = await createTestDocument(container, myUser, { roomId, roomContext: { draft: false } });
      document2 = await createTestDocument(container, myUser, { roomId, roomContext: { draft: false } });
      document3 = await createTestDocument(container, myUser, { roomId, roomContext: { draft: true } });
      await roomStore.saveRoom({ ...room, documents: [document1._id, document2._id, document3._id] });

      lockStore.takeRoomLock.resolves(lock);
      lockStore.releaseLock.resolves();
    });

    describe('when the provided document ids are different than the existing ones', () => {
      beforeEach(async () => {
        try {
          await sut.updateRoomDocumentsOrder(roomId, [uniqueId.create()]);
        } catch (error) {
          result = error;
        }
      });

      it('should throw BadRequest', () => {
        expect(result.name).toBe('BadRequestError');
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, roomId);
      });

      it('should release the lock on the room', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when the provided document ids is a reordered list of the ids of the draft and non draft documents', () => {
      beforeEach(async () => {
        result = await sut.updateRoomDocumentsOrder(roomId, [document3._id, document2._id, document1._id]);
      });

      it('should update the room documents order', () => {
        expect(result.documents).toEqual([document3._id, document2._id, document1._id]);
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, roomId);
      });

      it('should release the lock on the room', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });
  });

  describe('createRoomMessage', () => {
    let room;
    let result;

    beforeEach(async () => {
      room = await createTestRoom(container, { name: 'room', owner: myUser._id, createdBy: myUser._id });
      result = await sut.createRoomMessage({ room, text: 'message', emailNotification: true });
    });

    it('should return the updated room', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'room',
        slug: '',
        owner: myUser._id,
        isCollaborative: false,
        description: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        members: [],
        messages: [
          {
            key: expect.stringMatching(/\w+/),
            text: 'message',
            emailNotification: true,
            createdOn: now
          }
        ],
        documents: []
      });
    });
  });

  describe('deleteRoomMessage', () => {
    let room;
    let result;

    beforeEach(async () => {
      room = await createTestRoom(
        container,
        {
          name: 'room',
          owner: myUser._id,
          createdBy: myUser._id,
          messages: [
            {
              key: uniqueId.create(),
              text: 'message 1',
              emailNotification: true,
              createdOn: now
            },
            {
              key: uniqueId.create(),
              text: 'message 2',
              emailNotification: true,
              createdOn: now
            }
          ]
        }
      );
      result = await sut.deleteRoomMessage({ room, messageKey: room.messages[0].key });
    });

    it('should return the updated room', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'room',
        slug: '',
        owner: myUser._id,
        isCollaborative: false,
        description: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        members: [],
        messages: [
          {
            key: room.messages[1].key,
            text: 'message 2',
            emailNotification: true,
            createdOn: now
          }
        ],
        documents: []
      });
    });
  });

});
