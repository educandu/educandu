import sinon from 'sinon';
import UserService from '../services/user-service.js';
import ClientDataMapper from './client-data-mapper.js';
import { ROLE, ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('client-data-mapper', () => {
  const sandbox = sinon.createSandbox();

  let userService;
  let container;
  let result;
  let user1;
  let user2;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    userService = container.get(UserService);
    sut = container.get(ClientDataMapper);
  });

  beforeEach(async () => {
    user1 = await setupTestUser(container, { username: 'user1', email: 'user1@test.com' });
    user2 = await setupTestUser(container, { username: 'user2', email: 'user2@test.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('mapImportBatches', () => {
    let batches;

    beforeEach(async () => {
      batches = [
        {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user1._id,
          tasks: [
            {
              taskParams: {
                updatedOn: new Date()
              },
              attempts: [
                {
                  startedOn: new Date(),
                  completedOn: new Date()
                }
              ]
            }
          ]
        },
        {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user2._id,
          tasks: [
            {
              attempts: []
            }
          ]
        }
      ];
      result = await sut.mapImportBatches(batches, user1);
    });

    it('should map the batches', () => {
      expect(result).toEqual([
        {
          createdOn: batches[0].createdOn.toISOString(),
          completedOn: batches[0].completedOn.toISOString(),
          createdBy: {
            _id: user1._id,
            key: user1._id,
            username: user1.username
          },
          tasks: [
            {
              taskParams: {
                updatedOn: batches[0].tasks[0].taskParams.updatedOn.toISOString()
              },
              attempts: [
                {
                  startedOn: batches[0].tasks[0].attempts[0].startedOn.toISOString(),
                  completedOn: batches[0].tasks[0].attempts[0].completedOn.toISOString()
                }
              ]
            }
          ]
        },
        {
          createdOn: batches[1].createdOn.toISOString(),
          completedOn: batches[1].completedOn.toISOString(),
          createdBy: {
            _id: user2._id,
            key: user2._id,
            username: user2.username
          },
          tasks: [
            {
              attempts: []
            }
          ]
        }
      ]);
    });
  });

  describe('mapImportBatch', () => {
    let batch;

    beforeEach(async () => {
      batch = {
        createdOn: new Date(),
        completedOn: new Date(),
        createdBy: user1._id,
        tasks: [
          {
            taskParams: {
              updatedOn: new Date()
            },
            attempts: [
              {
                startedOn: new Date(),
                completedOn: new Date()
              }
            ]
          }
        ]
      };

      result = await sut.mapImportBatch(batch, user1);
    });

    it('should map the batch', () => {
      expect(result).toEqual({
        createdOn: batch.createdOn.toISOString(),
        completedOn: batch.completedOn.toISOString(),
        createdBy: {
          _id: user1._id,
          key: user1._id,
          username: user1.username
        },
        tasks: [
          {
            taskParams: {
              updatedOn: batch.tasks[0].taskParams.updatedOn.toISOString()
            },
            attempts: [
              {
                startedOn: batch.tasks[0].attempts[0].startedOn.toISOString(),
                completedOn: batch.tasks[0].attempts[0].completedOn.toISOString()
              }
            ]
          }
        ]
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

    const room = {
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

    beforeEach(async () => {
      sandbox.stub(userService, 'getUserById').resolves(owner);
      sandbox.stub(userService, 'getUsersByIds').resolves([member1, member2]);
      result = await sut.mapRoom(room, { roles: [ROLE.admin] });
    });

    it('should call getUserById with "owner"', () => {
      sinon.assert.calledWith(userService.getUserById, 'owner');
    });

    it('should call getUsersById with "[member1, memeber2]"', () => {
      sinon.assert.calledWith(userService.getUsersByIds, ['member1', 'member2']);
    });

    it('should return the mapped result', () => {
      expect(result).toEqual({
        ...room,
        owner: {
          email: owner.email,
          username: owner.username,
          _id: owner._id,
          key: owner._id
        },
        members: [
          {
            userId: room.members[0].userId,
            username: member1.username,
            joinedOn: room.members[0].joinedOn.toISOString()
          },
          {
            userId: room.members[1].userId,
            username: member2.username,
            joinedOn: room.members[1].joinedOn.toISOString()
          }
        ]
      });
    });
  });

  describe('mapRoomInvitations', () => {
    let invitations;

    beforeEach(async () => {
      invitations = [{ roomId: 'roomId', sentOn: new Date(), expires: new Date() }];
      result = await sut.mapRoomInvitations(invitations);
    });

    it('shoult map the invitations', () => {
      expect(result).toEqual([
        {
          roomId: 'roomId',
          sentOn: invitations[0].sentOn.toISOString(),
          expires: invitations[0].expires.toISOString()
        }
      ]);
    });
  });

  describe('mapLessons', () => {
    let lessons;

    beforeEach(async () => {
      lessons = [
        {
          createdOn: new Date(),
          updatedOn: new Date(),
          schedule: {
            startsOn: new Date()
          },
          sections: [
            {
              key: 'key',
              type: 'type',
              content: 'content',
              other: 'other'
            }
          ]
        }
      ];
      result = await sut.mapLessons(lessons);
    });

    it('should map the lessons', () => {
      expect(result).toEqual([
        {
          createdOn: lessons[0].createdOn.toISOString(),
          updatedOn: lessons[0].updatedOn.toISOString(),
          schedule: {
            startsOn: lessons[0].schedule.startsOn.toISOString()
          },
          sections: [
            {
              key: 'key',
              type: 'type',
              content: 'content'
            }
          ]
        }
      ]);
    });
  });
});
