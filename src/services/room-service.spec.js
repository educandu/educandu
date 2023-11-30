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
import DocumentStore from '../stores/document-store.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import DocumentInputStore from '../stores/document-input-store.js';
import RoomMediaItemStore from '../stores/room-media-item-store.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { EVENT_TYPE, INVALID_ROOM_INVITATION_REASON } from '../domain/constants.js';
import DocumentInputMediaItemStore from '../stores/document-input-media-item-store.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  destroyTestEnvironment,
  setupTestEnvironment,
  pruneTestEnvironment,
  createTestUser,
  createTestRoom,
  createTestDocument,
  createTestDocumentInput,
  createTestDocumentInputMediaItem
} from '../test-helper.js';

const { BadRequest, NotFound, Forbidden } = httpErrors;

describe('room-service', () => {
  let documentInputMediaItemStore;
  let documentRevisionStore;
  let documentCommentStore;
  let roomInvitationStore;
  let roomMediaItemStore;
  let documentInputStore;
  let storagePlanStore;
  let documentStore;
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
    documentStore = container.get(DocumentStore);
    storagePlanStore = container.get(StoragePlanStore);
    documentInputStore = container.get(DocumentInputStore);
    roomMediaItemStore = container.get(RoomMediaItemStore);
    roomInvitationStore = container.get(RoomInvitationStore);
    documentCommentStore = container.get(DocumentCommentStore);
    documentRevisionStore = container.get(DocumentRevisionStore);
    documentInputMediaItemStore = container.get(DocumentInputMediaItemStore);

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
        ownedBy: myUser._id,
        isCollaborative: false,
        shortDescription: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        overview: '',
        cdnResources: [],
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
    let remainingRooms;
    let remainingRoomsMediaItems;

    beforeEach(async () => {
      room = { _id: uniqueId.create() };
      userLock = { id: uniqueId.create() };
      roomDocuments = [{ _id: uniqueId.create() }, { _id: uniqueId.create() }];

      remainingRooms = [{ _id: uniqueId.create() }, { _id: uniqueId.create() }];
      remainingRoomsMediaItems = [
        [{ size: 10 }, { size: 10 }],
        [{ size: 30 }]
      ];

      lockStore.takeUserLock.resolves(userLock);
      lockStore.releaseLock.resolves();

      sandbox.stub(documentStore, 'getDocumentsMetadataByRoomId').resolves(roomDocuments);
      sandbox.stub(documentCommentStore, 'deleteDocumentCommentsByDocumentIds').resolves();
      sandbox.stub(documentRevisionStore, 'deleteDocumentsByRoomId').resolves();
      sandbox.stub(documentStore, 'deleteDocumentsByRoomId').resolves();
      sandbox.stub(documentInputStore, 'deleteDocumentInputsByDocumentIds').resolves();
      sandbox.stub(roomInvitationStore, 'deleteRoomInvitationsByRoomId').resolves();
      sandbox.stub(roomStore, 'deleteRoomById').resolves();
      sandbox.stub(roomMediaItemStore, 'deleteRoomMediaItemsByRoomId').resolves();
      sandbox.stub(documentInputMediaItemStore, 'deleteDocumentInputMediaItemsByRoomId').resolves();
      sandbox.stub(cdn, 'deleteDirectory').resolves();
      sandbox.stub(userStore, 'updateUserUsedBytes').resolves(cloneDeep(myUser));

      sandbox.stub(roomStore, 'getRoomsByOwnerUserId').resolves(remainingRooms);
      sandbox.stub(roomMediaItemStore, 'getAllRoomMediaItemsByRoomId');
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(remainingRooms[0]._id).resolves(remainingRoomsMediaItems[0]);
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(remainingRooms[1]._id).resolves(remainingRoomsMediaItems[1]);

      await sut.deleteRoom({ room, roomOwner: myUser });
    });

    it('should take the lock on the user record', () => {
      assert.calledWith(lockStore.takeUserLock, myUser._id);
    });

    it('should call documentStore.getDocumentsMetadataByRoomId', () => {
      assert.calledWith(documentStore.getDocumentsMetadataByRoomId, room._id, { session: match.object });
    });

    it('should call commentStore.deleteDocumentCommentsByDocumentIds', () => {
      assert.calledWith(documentCommentStore.deleteDocumentCommentsByDocumentIds, roomDocuments.map(d => d._id), { session: match.object });
    });

    it('should call documentStore.deleteDocumentsByRoomId', () => {
      assert.calledWith(documentStore.deleteDocumentsByRoomId, room._id, { session: match.object });
    });

    it('should call documentInputStore.deleteDocumentInputsByDocumentIds', () => {
      const documentIds = roomDocuments.map(doc => doc._id);
      assert.calledWith(documentInputStore.deleteDocumentInputsByDocumentIds, documentIds, { session: match.object });
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

    it('should call roomMediaItemStore.deleteRoomMediaItemsByRoomId', () => {
      assert.calledWith(roomMediaItemStore.deleteRoomMediaItemsByRoomId, room._id, { session: match.object });
    });

    it('should call documentInputMediaItemStore.deleteDocumentInputMediaItemsByRoomId', () => {
      assert.calledWith(documentInputMediaItemStore.deleteDocumentInputMediaItemsByRoomId, room._id, { session: match.object });
    });

    it('should call cdn.deleteDirectory for the room being deleted', () => {
      assert.calledWith(cdn.deleteDirectory, { directoryPath: `room-media/${room._id}` });
    });

    it('should call cdn.deleteDirectory for the document inputs of the room being deleted', () => {
      assert.calledWith(cdn.deleteDirectory, { directoryPath: `document-input-media/${room._id}` });
    });

    it('should call userStore.updateUserUsedBytes', () => {
      const usedBytes
        = remainingRoomsMediaItems[0][0].size
        + remainingRoomsMediaItems[0][1].size
        + remainingRoomsMediaItems[1][0].size;
      assert.calledWith(userStore.updateUserUsedBytes, { userId: myUser._id, usedBytes });
    });

    it('should release the lock', () => {
      assert.called(lockStore.releaseLock);
    });
  });

  describe('createOrUpdateInvitations', () => {
    let room = null;

    beforeEach(async () => {
      room = await createTestRoom(container, { name: 'my room', ownedBy: myUser._id, createdBy: myUser._id });
    });

    it('should create a new invitation for a room if it does not exist', async () => {
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], ownerUserId: myUser._id });
      expect(invitations[0].token).toBeDefined();
    });

    it('should throw a bad request if the owner invites themselves', async () => {
      await expect(() => sut.createOrUpdateInvitations({ roomId: room._id, emails: [myUser.email], ownerUserId: myUser._id })).rejects.toThrow(BadRequest);
    });

    it('should update an invitation if it already exists', async () => {
      const { invitations: originalInvitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], ownerUserId: myUser._id });
      sandbox.clock.tick(1000);
      const { invitations: updatedInvitations } = await sut.createOrUpdateInvitations({ roomId: room._id, emails: ['invited-user@test.com'], ownerUserId: myUser._id });
      expect(updatedInvitations[0]._id).toBe(originalInvitations[0]._id);
      expect(updatedInvitations[0].token).toBe(originalInvitations[0].token);
      expect(updatedInvitations[0].sentOn).not.toBe(originalInvitations[0].sentOn);
      expect(updatedInvitations[0].expiresOn.getTime()).toBeGreaterThan(originalInvitations[0].expiresOn.getTime());
    });

    it('should throw a NotFound error when the room does not exist', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitations({ roomId: 'abcabcabcabcabc', emails: ['invited-user@test.com'], ownerUserId: myUser._id });
      }).rejects.toThrow(NotFound);
    });

    it('should throw a NotFound error when the room exists, but belongs to a different user', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitations({ roomId: 'abcabcabcabcabc', emails: ['invited-user@test.com'], ownerUserId: 'xyzxyzxyzxyzxyz' });
      }).rejects.toThrow(NotFound);
    });
  });

  describe('verifyInvitationToken', () => {
    let testRoom = null;
    let invitation = null;

    beforeEach(async () => {
      testRoom = await createTestRoom(container, { name: 'my room', slug: 'room-slug', ownedBy: myUser._id, createdBy: myUser._id });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], ownerUserId: myUser._id });
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

    it('should be invalid if token is valid but user different', async () => {
      const { roomId, roomName, roomSlug, invalidInvitationReason } = await sut.verifyInvitationToken({ token: invitation.token, user: myUser });
      expect(invalidInvitationReason).toBe(INVALID_ROOM_INVITATION_REASON.differenUser);
      expect(roomId).toBeNull();
      expect(roomName).toBeNull();
      expect(roomSlug).toBeNull();
    });

    it('should be invalid if token is valid but user unconfirmed', async () => {
      myUser.expiresOn = now;
      const { roomId, roomName, roomSlug, invalidInvitationReason } = await sut.verifyInvitationToken({ token: invitation.token, user: myUser });
      expect(invalidInvitationReason).toBe(INVALID_ROOM_INVITATION_REASON.unconfirmedUser);
      expect(roomId).toBeNull();
      expect(roomName).toBeNull();
      expect(roomSlug).toBeNull();
    });
  });

  describe('confirmInvitation', () => {
    let testRoom = null;
    let invitation = null;

    beforeEach(async () => {
      testRoom = await createTestRoom(container, { name: 'my room', ownedBy: myUser._id, createdBy: myUser._id });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], ownerUserId: myUser._id });
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
          const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], ownerUserId: myUser._id });
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
      testRoom = await createTestRoom(container, { name: 'my room', ownedBy: myUser._id, createdBy: myUser._id });
      const { invitations } = await sut.createOrUpdateInvitations({ roomId: testRoom._id, emails: [otherUser.email], ownerUserId: myUser._id });
      invitation = invitations[0];
    });

    it('should retrieve the invitation', async () => {
      delete invitation.roomId;
      delete invitation.token;

      const invitations = await sut.getRoomInvitations(testRoom._id);
      expect(invitations).toEqual([invitation]);
    });
  });

  describe('updateRoomContent', () => {
    let room;
    let overview;
    let updatedRoom;

    beforeEach(async () => {
      room = await createTestRoom(container, { createdBy: myUser._id, ownedBy: myUser._id });
      overview = '# Lorem ipsum ![](cdn://media-library/some-image.jpg) dolores eos impedit.';
    });

    describe('when the overview contains references to CDN resources', () => {
      beforeEach(async () => {
        updatedRoom = await sut.updateRoomContent(room._id, { overview });
      });

      it('updates the cdnResources array', () => {
        expect(updatedRoom.cdnResources).toStrictEqual(['cdn://media-library/some-image.jpg']);
      });
    });
  });

  describe('updateRoomDocumentsOrder', () => {
    let lock;
    let room;
    let result;
    let document1;
    let document2;
    let document3;

    beforeEach(async () => {
      lock = { key: 'room' };
      room = await createTestRoom(container, { createdBy: myUser._id, ownedBy: myUser._id });
      document1 = await createTestDocument(container, myUser, { roomId: room._id, roomContext: { draft: false, inputSubmittingDisabled: false } });
      document2 = await createTestDocument(container, myUser, { roomId: room._id, roomContext: { draft: false, inputSubmittingDisabled: false } });
      document3 = await createTestDocument(container, myUser, { roomId: room._id, roomContext: { draft: true, inputSubmittingDisabled: false } });
      await roomStore.saveRoom({ ...room, documents: [document1._id, document2._id, document3._id] });

      lockStore.takeRoomLock.resolves(lock);
      lockStore.releaseLock.resolves();
    });

    describe('when the provided document ids are different than the existing ones', () => {
      beforeEach(async () => {
        try {
          await sut.updateRoomDocumentsOrder(room._id, [uniqueId.create()]);
        } catch (error) {
          result = error;
        }
      });

      it('should throw BadRequest', () => {
        expect(result.name).toBe('BadRequestError');
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, room._id);
      });

      it('should release the lock on the room', () => {
        assert.calledWith(lockStore.releaseLock, lock);
      });
    });

    describe('when the provided document ids is a reordered list of the ids of the draft and non draft documents', () => {
      beforeEach(async () => {
        result = await sut.updateRoomDocumentsOrder(room._id, [document3._id, document2._id, document1._id]);
      });

      it('should update the room documents order', () => {
        expect(result.documents).toEqual([document3._id, document2._id, document1._id]);
      });

      it('should take a lock on the room', () => {
        assert.calledWith(lockStore.takeRoomLock, room._id);
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
      room = await createTestRoom(container, { name: 'room', ownedBy: myUser._id, createdBy: myUser._id });
      result = await sut.createRoomMessage({ room, text: 'message', emailNotification: true });
    });

    it('should create an event', async () => {
      const eventFromDb = await db.events.findOne();
      expect(eventFromDb).toEqual({
        _id: expect.stringMatching(/\w+/),
        createdOn: now,
        params: {
          roomId: room._id,
          roomMessageKey: expect.stringMatching(/\w+/),
          userId: myUser._id
        },
        processedOn: null,
        processingErrors: [],
        type: EVENT_TYPE.roomMessageCreated
      });
    });

    it('should return the updated room', () => {
      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'room',
        slug: '',
        ownedBy: myUser._id,
        isCollaborative: false,
        shortDescription: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        overview: '',
        cdnResources: [],
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
          ownedBy: myUser._id,
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
        ownedBy: myUser._id,
        isCollaborative: false,
        shortDescription: '',
        createdOn: now,
        createdBy: myUser._id,
        updatedOn: now,
        overview: '',
        cdnResources: [],
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

  describe('getAllRoomMediaOverview', () => {
    let rooms;
    let result;
    let storagePlan;
    let room1MediaItems;
    let room2MediaItems;

    beforeEach(async () => {
      rooms = [
        { _id: uniqueId.create(), name: 'Room 1', ownedBy: myUser._id },
        { _id: uniqueId.create(), name: 'Room 2', ownedBy: myUser._id }
      ];

      const storagePlanId = uniqueId.create();
      storagePlan = {
        _id: storagePlanId,
        maxBytes: 500
      };
      myUser.storage = {
        planId: storagePlanId,
        usedBytes: 90
      };

      room1MediaItems = [
        {
          _id: uniqueId.create(),
          size: 10,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        },
        {
          _id: uniqueId.create(),
          size: 20,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
        }
      ];
      room2MediaItems = [
        {
          _id: uniqueId.create(),
          size: 30,
          url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
        }
      ];

      sandbox.stub(roomStore, 'getRoomsByOwnerUserId').resolves(rooms);
      sandbox.stub(storagePlanStore, 'getStoragePlanById').resolves(storagePlan);

      sandbox.stub(roomMediaItemStore, 'getAllRoomMediaItemsByRoomId');
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(rooms[0]._id).resolves(room1MediaItems);
      roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(rooms[1]._id).resolves(room2MediaItems);

      result = await sut.getAllRoomMediaOverview({ user: myUser });
    });

    it('should return the room media overview', () => {
      const usedBytes = room1MediaItems[0].size + room1MediaItems[1].size + room2MediaItems[0].size;
      expect(result).toEqual({
        storagePlan,
        usedBytes,
        roomStorageList: [
          {
            roomId: rooms[0]._id,
            roomMediaItems: room1MediaItems,
            roomName: rooms[0].name,
            usedBytesByDocumentInputMediaItems: 0,
            usedBytesByRoomMediaItems: 30,
            usedBytesPerDocumentInput: {}
          },
          {
            roomId: rooms[1]._id,
            roomMediaItems: room2MediaItems,
            roomName: rooms[1].name,
            usedBytesByDocumentInputMediaItems: 0,
            usedBytesByRoomMediaItems: 30,
            usedBytesPerDocumentInput: {}
          }
        ]
      });
    });
  });

  describe('createRoomMedia', () => {
    let room;
    let file;
    let result;
    let userLock;
    let storagePlan;
    let roomMediaItems;

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), ownedBy: uniqueId.create() };
        sandbox.stub(roomStore, 'getRoomById').resolves(room);
      });

      it('should throw forbidden', async () => {
        await expect(() => sut.createRoomMedia({ user: myUser, roomId: room._id, file: {} })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room owner does not have a storage plan', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), ownedBy: myUser._id };
        userLock = { id: uniqueId.create() };
        myUser.storage.planId = null;

        lockStore.takeUserLock.resolves(userLock);
        lockStore.releaseLock.resolves();

        sandbox.stub(roomStore, 'getRoomById').resolves(room);
      });

      it('should throw bad request', async () => {
        await expect(() => sut.createRoomMedia({ user: myUser, roomId: room._id, file: {} })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the room owner does not have enough storage left', () => {
      beforeEach(() => {
        file = { size: 15 };
        room = { _id: uniqueId.create(), ownedBy: myUser._id };
        userLock = { id: uniqueId.create() };

        const storagePlanId = uniqueId.create();
        storagePlan = {
          _id: storagePlanId,
          maxBytes: 100
        };
        myUser.storage = {
          planId: storagePlanId,
          usedBytes: 90
        };

        lockStore.takeUserLock.resolves(userLock);
        lockStore.releaseLock.resolves();

        sandbox.stub(roomStore, 'getRoomById').resolves(room);
        sandbox.stub(storagePlanStore, 'getStoragePlanById').resolves(storagePlan);
      });

      it('should throw bad request', async () => {
        await expect(() => sut.createRoomMedia({ user: myUser, roomId: room._id, file })).rejects.toThrow(BadRequest);
      });
    });

    describe('when the room owner has enough storage space', () => {
      beforeEach(async () => {
        file = {
          size: 15,
          path: 'file/path'
        };
        room = { _id: uniqueId.create(), ownedBy: myUser._id, name: 'Room 1' };
        userLock = { id: uniqueId.create() };

        const storagePlanId = uniqueId.create();
        storagePlan = {
          _id: storagePlanId,
          maxBytes: 500
        };
        myUser.storage = {
          planId: storagePlanId,
          usedBytes: 90
        };

        lockStore.takeUserLock.resolves(userLock);
        lockStore.releaseLock.resolves();

        sandbox.stub(roomStore, 'getRoomById').resolves(room);
        sandbox.stub(storagePlanStore, 'getStoragePlanById').resolves(storagePlan);

        roomMediaItems = [
          {
            _id: uniqueId.create(),
            size: 10,
            url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
          },
          {
            _id: uniqueId.create(),
            size: 20,
            url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
          }
        ];

        sandbox.stub(cdn, 'moveObject').resolves();
        sandbox.stub(roomMediaItemStore, 'insertRoomMediaItem').resolves();

        sandbox.stub(roomStore, 'getRoomsByOwnerUserId').resolves([room]);
        sandbox.stub(roomMediaItemStore, 'getAllRoomMediaItemsByRoomId').resolves(roomMediaItems);
        sandbox.stub(userStore, 'updateUserUsedBytes').resolves(cloneDeep(myUser));

        result = await sut.createRoomMedia({ user: myUser, roomId: room._id, file });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call roomStore.getRoomById', () => {
        assert.calledWith(roomStore.getRoomById, room._id);
      });

      it('should call cdn.moveObject', () => {
        assert.called(cdn.moveObject);
      });

      it('should call userStore.updateUserUsedBytes', () => {
        const usedBytes = roomMediaItems[0].size + roomMediaItems[1].size;
        assert.calledWith(userStore.updateUserUsedBytes, { userId: myUser._id, usedBytes });
      });

      it('should return the room media overview', () => {
        const usedBytes = roomMediaItems[0].size + roomMediaItems[1].size;
        expect(result).toEqual({
          createdRoomMediaItemId: expect.any(String),
          storagePlan,
          usedBytes,
          roomStorage: {
            roomId: room._id,
            roomMediaItems,
            roomName: 'Room 1',
            usedBytesByDocumentInputMediaItems: 0,
            usedBytesByRoomMediaItems: 30,
            usedBytesPerDocumentInput: {}
          }
        });
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });
  });

  describe('deleteRoomMedia', () => {
    let room;
    let userLock;
    let roomMediaItems;

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        room = { _id: uniqueId.create(), ownedBy: uniqueId.create() };
        userLock = { id: uniqueId.create() };
        roomMediaItems = [
          {
            _id: uniqueId.create(),
            size: 10,
            url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
          }
        ];

        lockStore.takeUserLock.resolves(userLock);
        lockStore.releaseLock.resolves();

        sandbox.stub(roomStore, 'getRoomById').resolves(room);
      });

      it('should throw forbidden', async () => {
        await expect(() => sut.deleteRoomMedia({ user: myUser, roomId: room._id, roomMediaItemId: roomMediaItems[0]._id })).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is the room owner', () => {
      beforeEach(async () => {
        room = { _id: uniqueId.create(), ownedBy: myUser._id };
        userLock = { id: uniqueId.create() };
        roomMediaItems = [
          {
            _id: uniqueId.create(),
            size: 10,
            url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png'
          },
          {
            _id: uniqueId.create(),
            size: 20,
            url: 'cdn://room-media/dD6coNQoTsK8pgmy94P83g/boat-trips-KIoLnzk8NNwbxRWTHXmoI7.png'
          }
        ];

        lockStore.takeUserLock.resolves(userLock);
        lockStore.releaseLock.resolves();

        sandbox.stub(roomStore, 'getRoomById').resolves(room);
        sandbox.stub(roomMediaItemStore, 'getRoomMediaItemById').resolves(roomMediaItems[0]);
        sandbox.stub(cdn, 'deleteObject').resolves();
        sandbox.stub(roomMediaItemStore, 'deleteRoomMediaItem').resolves();
        sandbox.stub(userStore, 'updateUserUsedBytes').resolves(cloneDeep(myUser));

        sandbox.stub(roomStore, 'getRoomsByOwnerUserId').resolves([room]);
        sandbox.stub(roomMediaItemStore, 'getAllRoomMediaItemsByRoomId');
        roomMediaItemStore.getAllRoomMediaItemsByRoomId.withArgs(room._id).resolves([roomMediaItems[1]]);

        await sut.deleteRoomMedia({ user: myUser, roomId: room._id, roomMediaItemId: roomMediaItems[0]._id });
      });

      it('should take the lock on the user record', () => {
        assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call roomStore.getRoomById', () => {
        assert.calledWith(roomStore.getRoomById, room._id);
      });

      it('should call roomMediaItemStore.getRoomMediaItemById', () => {
        assert.calledWith(roomMediaItemStore.getRoomMediaItemById, roomMediaItems[0]._id);
      });

      it('should call cdn.deleteObject for the file being deleted', () => {
        assert.calledWith(cdn.deleteObject, 'room-media/dD6coNQoTsK8pgmy94P83g/flight-schedule-UtzL4CqWGfoptve6Ddkazn.png');
      });

      it('should call userStore.updateUserUsedBytes', () => {
        const usedBytes = roomMediaItems[1].size;
        assert.calledWith(userStore.updateUserUsedBytes, { userId: myUser._id, usedBytes });
      });

      it('should release the lock', () => {
        assert.called(lockStore.releaseLock);
      });
    });
  });

  describe('removeRoomMember', () => {
    let currentRoom;
    let otherRoom;
    let documentInCurrentRoom;
    let documentInOtherRoom;
    let documentInputInCurrentRoom1;
    let documentInputInCurrentRoom2;
    let documentInputInOtherRoom;

    describe('when a room member is removed', () => {
      beforeEach(async () => {
        const currentRoomId = uniqueId.create();
        const otherRoomId = uniqueId.create();

        currentRoom = await createTestRoom(container, {
          _id: currentRoomId,
          ownedBy: otherUser._id,
          members: [{ userId: myUser._id, joinedOn: new Date() }]
        });
        documentInCurrentRoom = await createTestDocument(container, otherUser, { roomId: currentRoomId, roomContext: { draft: false, inputSubmittingDisabled: false } });
        await db.rooms.updateOne({ _id: currentRoomId }, { $set: { documents: [documentInCurrentRoom._id] } });
        // eslint-disable-next-line require-atomic-updates
        currentRoom = await db.rooms.findOne({ _id: currentRoom._id });

        otherRoom = await createTestRoom(container, {
          _id: otherRoomId,
          ownedBy: otherUser._id,
          members: [{ userId: myUser._id, joinedOn: new Date() }]
        });
        documentInOtherRoom = await createTestDocument(container, otherUser, { roomId: otherRoomId, roomContext: { draft: false, inputSubmittingDisabled: false } });
        await db.rooms.updateOne({ _id: currentRoomId }, { $set: { documents: [documentInOtherRoom._id] } });
        // eslint-disable-next-line require-atomic-updates
        otherRoom = await db.rooms.findOne({ _id: otherRoom._id });

        documentInputInCurrentRoom1 = await createTestDocumentInput(container, myUser, {
          documentId: documentInCurrentRoom._id,
          documentRevisionId: documentInCurrentRoom.revision,
          sections: {}
        });
        documentInputInCurrentRoom2 = await createTestDocumentInput(container, otherUser, {
          documentId: documentInCurrentRoom._id,
          documentRevisionId: documentInCurrentRoom.revision,
          sections: {}
        });
        documentInputInOtherRoom = await createTestDocumentInput(container, myUser, {
          documentId: documentInOtherRoom._id,
          documentRevisionId: documentInOtherRoom.revision,
          sections: {}
        });

        await createTestDocumentInputMediaItem(container, myUser, {
          documentInputId: documentInputInCurrentRoom1._id,
          documentId: documentInCurrentRoom._id,
          roomId: currentRoomId
        });
        await createTestDocumentInputMediaItem(container, otherUser, {
          documentInputId: documentInputInCurrentRoom2._id,
          documentId: documentInCurrentRoom._id,
          roomId: currentRoomId
        });
        await createTestDocumentInputMediaItem(container, myUser, {
          documentInputId: documentInputInOtherRoom._id,
          documentId: documentInOtherRoom._id,
          roomId: otherRoomId
        });

        sandbox.stub(cdn, 'deleteDirectory').resolves();

        await sut.removeRoomMember({ room: currentRoom, memberUserId: myUser._id });
      });

      it('should update the room members list', async () => {
        const updatedRoom = await db.rooms.findOne({ _id: currentRoom._id });
        expect(updatedRoom.members).toEqual([]);
      });

      it('should delete the user\'s document inputs in the current room', async () => {
        const allRemainingUserDocumentInputs = await db.documentInputs.find({ createdBy: myUser._id }).toArray();
        expect(allRemainingUserDocumentInputs.length).toEqual(1);
        expect(allRemainingUserDocumentInputs[0]._id).toEqual(documentInputInOtherRoom._id);
      });

      it('should delete the user\'s document inputs media in the current room', async () => {
        const allRemainingDocumentInputsMediaInCurrentRoom = await db.documentInputMediaItems.find({ roomId: currentRoom._id }).toArray();
        expect(allRemainingDocumentInputsMediaInCurrentRoom.length).toEqual(1);
        expect(allRemainingDocumentInputsMediaInCurrentRoom[0].createdBy).toEqual(otherUser._id);
      });
    });
  });
});
