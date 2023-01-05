import httpErrors from 'http-errors';
import RoomService from './room-service.js';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import { assert, createSandbox } from 'sinon';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { INVALID_ROOM_INVITATION_REASON, ROOM_DOCUMENTS_MODE } from '../domain/constants.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser, createTestDocument } from '../test-helper.js';

const { BadRequest, NotFound } = httpErrors;

describe('room-service', () => {
  let db;
  let sut;
  let myUser;
  let result;
  let container;
  let otherUser;
  let roomStore;
  let lockStore;

  const now = new Date();
  const sandbox = createSandbox();

  beforeAll(async () => {
    container = await setupTestEnvironment();

    lockStore = container.get(LockStore);
    roomStore = container.get(RoomStore);

    sut = container.get(RoomService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.useFakeTimers(now);

    sandbox.stub(lockStore, 'takeRoomLock');
    sandbox.stub(lockStore, 'releaseLock');

    myUser = await setupTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
    otherUser = await setupTestUser(container, { email: 'goofy@ducktown.com', displayName: 'Goofy' });
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('createRoom', () => {
    let createdRoom;

    beforeEach(async () => {
      createdRoom = await sut.createRoom({
        name: 'my room',
        slug: '  my-room  ',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
        user: myUser
      });
    });

    it('should create a room', () => {
      expect(createdRoom).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        slug: 'my-room',
        owner: myUser._id,
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
        description: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        members: [],
        documents: []
      });
    });

    it('should write it to the database', async () => {
      const retrievedRoom = await roomStore.getRoomById(createdRoom._id);
      expect(retrievedRoom).toEqual(createdRoom);
    });
  });

  describe('createOrUpdateInvitations', () => {
    let room = null;

    beforeEach(async () => {
      room = await sut.createRoom({
        name: 'my room',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
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
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
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
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
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
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
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

  describe('isRoomOwnerOrMember', () => {
    const roomId = uniqueId.create();

    beforeEach(async () => {
      await roomStore.saveRoom({
        _id: roomId,
        name: 'my room',
        slug: 'my-slug',
        description: '',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
        createdBy: myUser._id,
        createdOn: new Date(),
        updatedOn: new Date(),
        owner: myUser._id,
        members: [
          {
            userId: otherUser._id,
            joinedOn: new Date()
          }
        ],
        documents: []
      });
    });

    it('should return true when the user is the owner', async () => {
      result = await sut.isRoomOwnerOrMember(roomId, myUser._id);
      expect(result).toBe(true);
    });

    it('should return true when the user is a member', async () => {
      result = await sut.isRoomOwnerOrMember(roomId, otherUser._id);
      expect(result).toBe(true);
    });

    it('should return false when the is not a member', async () => {
      result = await sut.isRoomOwnerOrMember(roomId, uniqueId.create());
      expect(result).toBe(false);
    });
  });

  describe('updateRoomDocumentsOrder', () => {
    let lock;
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
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
        createdBy: myUser._id,
        createdOn: new Date(),
        updatedOn: new Date(),
        owner: myUser._id,
        members: [],
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

    describe('when the provided document ids is a reordered list of the ids of the non draft documents', () => {
      beforeEach(async () => {
        result = await sut.updateRoomDocumentsOrder(roomId, [document2._id, document1._id]);
      });

      it('should update the room documents order (having draft documents at the end)', () => {
        expect(result.documents).toEqual([document2._id, document1._id, document3._id]);
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

      it('should update the room documents order (having draft documents at the end)', () => {
        expect(result.documents).toEqual([document2._id, document1._id, document3._id]);
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, roomId);
      });

      it('should release the lock on the room', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });
  });

});
