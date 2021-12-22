import sinon from 'sinon';
import { ROLE } from '../domain/role.js';
import UserService from '../services/user-service.js';
import ClientDataMapper from './client-data-mapper.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('client-data-mapper', () => {
  const sandbox = sinon.createSandbox();
  let container;
  let user;
  let userService;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    userService = container.get(UserService);
    sut = container.get(ClientDataMapper);
  });

  beforeEach(async () => {
    user = await setupTestUser(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('mapImportBatches', () => {
    it('should map the user data', async () => {
      const user2 = await setupTestUser(container, { username: 'test2', email: 'test2@x.com' });
      const batches = await sut.mapImportBatches([{ createdBy: user._id }, { createdBy: user2._id }], user);
      expect(batches[0].createdBy).toEqual({
        _id: user._id,
        key: user._id,
        username: user.username
      });

      expect(batches[1].createdBy).toEqual({
        _id: user2._id,
        key: user2._id,
        username: user2.username
      });
    });
  });

  describe('mapImportBatch', () => {
    it('should map the user data', async () => {
      const batch = await sut.mapImportBatch({ createdBy: user._id }, user);
      expect(batch.createdBy).toEqual({
        _id: user._id,
        key: user._id,
        username: user.username
      });
    });
  });

  describe('mapRoom', () => {
    const owner = {
      _id: 'owner',
      email: 'owner@owner',
      username: 'owner'
    };

    const member1 = {
      _id: 'member1',
      username: 'member1'
    };

    const member2 = {
      _id: 'member2',
      username: 'member2'
    };

    const fakeRoom = {
      _id: 'roomId',
      name: 'my room',
      owner: 'owner',
      members: [
        {
          userId: 'member1',
          joinedOn: new Date()
        },
        {
          userId: 'member2',
          joinedOn: new Date()
        }
      ],
      access: ROOM_ACCESS_LEVEL.public
    };
    let result;

    beforeEach(async () => {
      sandbox.stub(userService, 'getUserById').resolves(owner);
      sandbox.stub(userService, 'getUsersByIds').resolves([member1, member2]);
      result = await sut.mapRoom(fakeRoom, { roles: [ROLE.admin] });
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
          _id: owner._id,
          key: owner._id
        },
        members: [
          {
            userId: fakeRoom.members[0].userId,
            username: member1.username,
            joinedOn: fakeRoom.members[0].joinedOn
          },
          {
            userId: fakeRoom.members[1].userId,
            username: member2.username,
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
