import sinon from 'sinon';
import UserService from './user-service.js';
import RoomService from './room-service.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';
import RoomStore from '../stores/room-store.js';

describe('room-service', () => {
  const sandbox = sinon.createSandbox();
  let container;
  let userService;
  let roomStore;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    userService = container.get(UserService);
    roomStore = container.get(RoomStore);
    sut = container.get(RoomService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('createRoom', () => {
    it('should create a room', async () => {
      const result = await sut.createRoom({ name: 'my room', owner: 'abc', access: ROOM_ACCESS_LEVEL.public });

      expect(result).toEqual({
        _id: expect.stringMatching(/\w+/),
        name: 'my room',
        owner: 'abc',
        access: ROOM_ACCESS_LEVEL.public,
        members: []
      });
    });
  });

  describe('getRoomDetailsById', () => {
    const owner = {
      _id: 'owner',
      email: 'owner@owner',
      username: 'owner'
    };

    const member1 = {
      _id: 'member1',
      email: 'member1@member1',
      username: 'member1'
    };

    const member2 = {
      _id: 'member2',
      email: 'member2@member2',
      username: 'member2'
    };

    const fakeRoom = {
      _id: 'roomId',
      name: 'my room',
      owner: 'owner',
      members: [
        {
          userId: 'member1',
          joinedOn: new Date().toISOString()
        },
        {
          userId: 'member2',
          joinedOn: new Date().toISOString()
        }
      ],
      access: ROOM_ACCESS_LEVEL.public
    };
    let result;

    beforeEach(async () => {
      sandbox.stub(userService, 'getUserById').resolves(owner);
      sandbox.stub(userService, 'getUsersByIds').resolves([member1, member2]);
      sandbox.stub(roomStore, 'findOne').resolves(fakeRoom);
      result = await sut.getRoomDetailsById('roomId');
    });

    it('should call getUserById with "owner"', () => {
      sinon.assert.calledWith(userService.getUserById, 'owner');
    });

    it('should call getUsersById with "[member1, memeber2]"', () => {
      sinon.assert.calledWith(userService.getUsersByIds, ['member1', 'member2']);
    });

    it('should return the mapped result', () => {
      expect(result).toEqual({
        ...fakeRoom,
        owner: {
          email: owner.email,
          username: owner.username,
          userId: owner._id
        },
        members: [
          {
            userId: fakeRoom.members[0].userId,
            username: member1.username,
            email: member1.email,
            joinedOn: fakeRoom.members[0].joinedOn
          },
          {
            userId: fakeRoom.members[1].userId,
            username: member2.username,
            email: member2.email,
            joinedOn: fakeRoom.members[1].joinedOn
          }
        ]
      });
    });

    afterEach(async () => {
      await pruneTestEnvironment(container);
      sandbox.restore();
    });
  });
});
