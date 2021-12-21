import httpErrors from 'http-errors';
import RoomService from './room-service.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest, NotFound } = httpErrors;

describe('room-service', () => {
  let sut;
  let myUser;
  let otherUser;
  let container;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    myUser = await setupTestUser(container, { username: 'Me', email: 'i@myself.com' });
    otherUser = await setupTestUser(container, { username: 'Goofy', email: 'goofy@ducktown.com' });
    sut = container.get(RoomService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('createRoom', () => {
    it('should create a room', async () => {
      const result = await sut.createRoom({ name: 'my room', access: ROOM_ACCESS_LEVEL.public, user: myUser });

      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        owner: myUser._id,
        access: ROOM_ACCESS_LEVEL.public,
        members: []
      });
    });
  });

  describe('findOwnedRoomById', () => {
    let myRoom = null;
    let otherRoom = null;

    beforeEach(async () => {
      [myRoom, otherRoom] = await Promise.all([
        sut.createRoom({ name: 'my room', access: ROOM_ACCESS_LEVEL.public, user: myUser }),
        sut.createRoom({ name: 'not my room', access: ROOM_ACCESS_LEVEL.public, user: otherUser })
      ]);
    });

    it('should find rooms owned by the specified user ID', async () => {
      const room = await sut.findOwnedRoomById({ roomId: myRoom._id, ownerId: myUser._id });
      expect(room.name).toBe('my room');
    });

    it('should throw when trying to find rooms owned by other users', async () => {
      await expect(async () => {
        await sut.findOwnedRoomById({ roomId: otherRoom._id, ownerId: myUser._id });
      }).rejects.toThrow(NotFound);
    });
  });

  describe('createOrUpdateInvitation', () => {
    let myPublicRoom = null;
    let myPrivateRoom = null;

    beforeEach(async () => {
      [myPublicRoom, myPrivateRoom] = await Promise.all([
        await sut.createRoom({ name: 'my public room', access: ROOM_ACCESS_LEVEL.public, user: myUser }),
        await sut.createRoom({ name: 'my private room', access: ROOM_ACCESS_LEVEL.private, user: myUser })
      ]);
    });

    it('should create a new invitation if it does not exist', async () => {
      const { invitation } = await sut.createOrUpdateInvitation({ roomId: myPrivateRoom._id, email: 'invited-user@test.com', user: myUser });
      expect(invitation.token).toBeDefined();
    });

    it('should update an invitation if it already exists', async () => {
      const { invitation: originalInvitation } = await sut.createOrUpdateInvitation({ roomId: myPrivateRoom._id, email: 'invited-user@test.com', user: myUser });
      const { invitation: updatedInvitation } = await sut.createOrUpdateInvitation({ roomId: myPrivateRoom._id, email: 'invited-user@test.com', user: myUser });
      expect(updatedInvitation._id).toBe(originalInvitation._id);
      expect(updatedInvitation.token).not.toBe(originalInvitation.token);
      expect(updatedInvitation.sentOn).not.toBe(originalInvitation.sentOn);
      expect(updatedInvitation.expires.getTime()).toBeGreaterThan(originalInvitation.expires.getTime());
    });

    it('should throw a BadRequest error when the room is public', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitation({ roomId: myPublicRoom._id, email: 'invited-user@test.com', user: myUser });
      }).rejects.toThrow(BadRequest);
    });

    it('should throw a NotFound error when the room does not exist', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitation({ roomId: 'abcabcabcabcabc', email: 'invited-user@test.com', user: myUser });
      }).rejects.toThrow(NotFound);
    });

    it('should throw a NotFound error when the room exists, but belongs to a different user', async () => {
      await expect(async () => {
        await sut.createOrUpdateInvitation({ roomId: 'abcabcabcabcabc', email: 'invited-user@test.com', user: { _id: 'xyzxyzxyzxyzxyz' } });
      }).rejects.toThrow(NotFound);
    });

  });

});
