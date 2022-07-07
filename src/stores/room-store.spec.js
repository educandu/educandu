import RoomStore from './room-store.js';
import uniqueId from '../utils/unique-id.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import { destroyTestEnvironment, setupTestEnvironment, pruneTestEnvironment, setupTestUser, createTestRoom } from '../test-helper.js';

describe('room-store', () => {
  let sut;
  let myUser;
  let container;
  let otherUser;
  let onlyJoiningUser;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(RoomStore);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    myUser = await setupTestUser(container, { username: 'Me', email: 'i@myself.com' });
    otherUser = await setupTestUser(container, { username: 'Goofy', email: 'goofy@ducktown.com' });
    onlyJoiningUser = await setupTestUser(container, { username: 'Dagobert', email: 'dagobert@ducktown.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('getRoomsOwnedOrJoinedByUser', () => {
    let result;

    beforeEach(async () => {
      const rooms = [
        {
          name: 'Room 1',
          owner: myUser._id
        },
        {
          name: 'Room 2',
          owner: otherUser._id,
          members: [{ userId: myUser._id, joinedOn: new Date() }]
        },
        {
          name: 'Room 3',
          owner: otherUser._id,
          members: []
        },
        {
          name: 'Room 4',
          owner: otherUser._id,
          members: [{ userId: onlyJoiningUser._id, joinedOn: new Date() }]
        }
      ];
      await Promise.all(rooms.map(room => createTestRoom(container, room)));
    });

    describe('when called with a user that both owns rooms and has joined rooms', () => {
      beforeEach(async () => {
        result = await sut.getRoomsOwnedOrJoinedByUser(myUser._id);
      });

      it('should return all owned and joined rooms', () => {
        expect(result).toHaveLength(2);
        expect(result.map(room => room.name)).toEqual(expect.arrayContaining(['Room 1', 'Room 2']));
      });
    });

    describe('when called with a user that only owns rooms', () => {
      beforeEach(async () => {
        result = await sut.getRoomsOwnedOrJoinedByUser(otherUser._id);
      });

      it('should return all owned rooms', () => {
        expect(result).toHaveLength(3);
        expect(result.map(room => room.name)).toEqual(expect.arrayContaining(['Room 2', 'Room 3', 'Room 4']));
      });
    });

    describe('when called with a user that has only joined rooms', () => {
      beforeEach(async () => {
        result = await sut.getRoomsOwnedOrJoinedByUser(onlyJoiningUser._id);
      });

      it('should return all joined rooms', () => {
        expect(result.map(room => room.name)).toEqual(['Room 4']);
      });
    });
  });

  describe('getRoomByIdAndOwnerId', () => {
    let myRoom = null;
    let otherRoom = null;

    beforeEach(async () => {
      [myRoom, otherRoom] = await Promise.all([
        createTestRoom(container, { name: 'my room', access: ROOM_ACCESS_LEVEL.public, owner: myUser._id }),
        createTestRoom(container, { name: 'not my room', access: ROOM_ACCESS_LEVEL.public, owner: otherUser._id })
      ]);
    });

    it('should find rooms owned by the specified user ID', async () => {
      const room = await sut.getRoomByIdAndOwnerId({ roomId: myRoom._id, ownerId: myUser._id });
      expect(room.name).toBe('my room');
    });

    it('should not find rooms owned by other users', async () => {
      const room = await sut.getRoomByIdAndOwnerId({ roomId: otherRoom._id, ownerId: myUser._id });
      expect(room).toBeNull();
    });
  });

  describe('deleteRoomsMemberById', () => {
    let ownedRoom;
    let memberOfRoom;

    beforeEach(async () => {
      const roomId1 = uniqueId.create();
      const roomId2 = uniqueId.create();

      await Promise.all([
        createTestRoom(
          container,
          {
            _id: roomId1,
            name: 'owned room',
            owner: myUser._id,
            members: [
              {
                userId: otherUser._id,
                joinedOn: new Date()
              },
              {
                userId: uniqueId.create(),
                joinedOn: new Date()
              }
            ]
          }
        ),
        createTestRoom(
          container,
          {
            _id: roomId2,
            name: 'member of room',
            owner: otherUser._id,
            members: [
              {
                userId: myUser._id,
                joinedOn: new Date()
              },
              {
                userId: uniqueId.create(),
                joinedOn: new Date()
              }
            ]
          }
        )
      ]);

      await sut.deleteRoomsMemberById(myUser._id);
      ownedRoom = await sut.getRoomById(roomId1);
      memberOfRoom = await sut.getRoomById(roomId2);
    });

    it('should not change the members of the owned room', () => {
      expect(ownedRoom.members).toHaveLength(2);
    });

    it('should remove the user from the room he is a member of', () => {
      expect(memberOfRoom.members).toHaveLength(1);
      expect(memberOfRoom.members[0].userId).not.toEqual(myUser._id);
    });
  });
});
