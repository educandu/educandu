import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import ClientDataMappingService from './client-data-mapping-service.js';
import { BATCH_TYPE, FAVORITE_TYPE, ROLE, ROOM_ACCESS, TASK_TYPE } from '../domain/constants.js';
import { createTestRoom, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('client-data-mapping-service', () => {
  const sandbox = sinon.createSandbox();

  let userStore;
  let container;
  let result;
  let user1;
  let user2;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    userStore = container.get(UserStore);
    sut = container.get(ClientDataMappingService);
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

  describe('mapWebsiteUser', () => {
    let dbUser;
    const favoriteSetOnDate = new Date();

    beforeEach(() => {
      dbUser = {
        _id: 'k991UQneLdmDGrAgqR7s6q',
        provider: 'educandu',
        username: 'test',
        passwordHash: '$2b$04$9elh9hoLz/8p8lJaqdSl5.aN2bse1lqDDKCZn2gEft3bIscnEP2Ke',
        email: 'test@test.com',
        roles: ['user', 'admin'],
        expires: null,
        verificationCode: null,
        lockedOut: false,
        profile: null,
        storage: {
          plan: 'lkdkgfj',
          usedBytes: 0,
          reminders: [
            {
              timestamp: new Date(),
              createdBy: 'kjghdskjhgfdsf'
            }
          ]
        },
        favorites: [
          {
            type: FAVORITE_TYPE.document,
            id: '4589ct29nr76n4x9214',
            setOn: favoriteSetOnDate
          }
        ]
      };
      result = sut.mapWebsiteUser(dbUser);
    });

    it('should map the user from the database', () => {
      expect(result).toStrictEqual({
        _id: 'k991UQneLdmDGrAgqR7s6q',
        provider: 'educandu',
        username: 'test',
        email: 'test@test.com',
        roles: ['user', 'admin'],
        profile: null,
        storage: {
          plan: 'lkdkgfj',
          usedBytes: 0
        },
        favorites: [
          {
            type: FAVORITE_TYPE.document,
            id: '4589ct29nr76n4x9214',
            setOn: favoriteSetOnDate.toISOString()
          }
        ]
      });
    });
  });

  describe('mapBatches', () => {
    let batches;

    beforeEach(async () => {
      batches = [
        {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user1._id,
          batchType: BATCH_TYPE.documentImport,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentImport,
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
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: []
            }
          ]
        }
      ];
      result = await sut.mapBatches(batches, user1);
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
          batchType: BATCH_TYPE.documentImport,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentImport,
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
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: []
            }
          ]
        }
      ]);
    });
  });

  describe('mapBatch', () => {
    let batch;

    describe('for batches/tasks of type `document-import`', () => {
      beforeEach(async () => {
        batch = {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user1._id,
          batchType: BATCH_TYPE.documentImport,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentImport,
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

        result = await sut.mapBatch(batch, user1);
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
          batchType: BATCH_TYPE.documentImport,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentImport,
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

    describe('for batches/tasks of type `document-regeneration`', () => {
      beforeEach(async () => {
        batch = {
          createdOn: new Date(),
          completedOn: new Date(),
          createdBy: user1._id,
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
              attempts: [
                {
                  startedOn: new Date(),
                  completedOn: new Date()
                }
              ]
            }
          ]
        };

        result = await sut.mapBatch(batch, user1);
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
          batchType: BATCH_TYPE.documentRegeneration,
          batchParams: {},
          tasks: [
            {
              taskType: TASK_TYPE.documentRegeneration,
              taskParams: {},
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

  });

  describe('mapRoom', () => {
    const owner = {
      _id: 'owner',
      email: 'owner@owner',
      username: 'owner',
      storage: { plan: 'basic', usedBytes: 20, reminders: [] }
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
      createdOn: new Date(),
      updatedOn: new Date(),
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
      access: ROOM_ACCESS.public
    };

    beforeEach(async () => {
      sandbox.stub(userStore, 'getUserById').resolves(owner);
      sandbox.stub(userStore, 'getUsersByIds').resolves([member1, member2]);
      result = await sut.mapRoom(room, { roles: [ROLE.admin] });
    });

    it('should call getUserById with "owner"', () => {
      sinon.assert.calledWith(userStore.getUserById, 'owner');
    });

    it('should call getUsersById with "[member1, memeber2]"', () => {
      sinon.assert.calledWith(userStore.getUsersByIds, ['member1', 'member2']);
    });

    it('should return the mapped result', () => {
      expect(result).toEqual({
        ...room,
        createdOn: room.createdOn.toISOString(),
        updatedOn: room.createdOn.toISOString(),
        owner: {
          username: owner.username,
          email: owner.email,
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

  describe('mapRoomInvitationWithBasicRoomData', () => {
    let room;
    let invitation;

    beforeEach(async () => {
      room = await createTestRoom(container, { owner: user1._id });
      invitation = { _id: uniqueId.create(), roomId: room._id, sentOn: new Date(), expires: new Date() };

      result = await sut.mapRoomInvitationWithBasicRoomData(invitation);
    });

    it('shoult map room data into the basic invitation data', () => {
      expect(result).toEqual({
        _id: invitation._id,
        sentOn: invitation.sentOn.toISOString(),
        expires: invitation.expires.toISOString(),
        room: {
          name: room.name,
          access: room.access,
          lessonsMode: room.lessonsMode,
          owner: {
            username: user1.username
          }
        }
      });
    });
  });

  describe('mapLessonsMetadata', () => {
    let lessons;

    beforeEach(async () => {
      lessons = [
        {
          createdOn: new Date(),
          updatedOn: new Date(),
          schedule: {
            startsOn: new Date()
          }
        }
      ];
      result = await sut.mapLessonsMetadata(lessons);
    });

    it('should map the lessons metadata', () => {
      expect(result).toEqual([
        {
          createdOn: lessons[0].createdOn.toISOString(),
          updatedOn: lessons[0].updatedOn.toISOString(),
          schedule: {
            startsOn: lessons[0].schedule.startsOn.toISOString()
          }
        }
      ]);
    });
  });
});
