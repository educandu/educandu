import Database from '../stores/database.js';
import DashboardService from './dashboard-service.js';
import { FAVORITE_TYPE, USER_ACTIVITY_TYPE } from '../domain/constants.js';
import {
  createTestDocument,
  createTestLesson,
  createTestRoom,
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  setupTestUser
} from '../test-helper.js';

describe('dashboard-service', () => {
  let db;
  let sut;
  let user;
  let result;
  let container;
  let otherUser;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    db = container.get(Database);
    sut = container.get(DashboardService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    user = await setupTestUser(container, { username: 'user', email: 'user@test.com' });
    otherUser = await setupTestUser(container, { username: 'other', email: 'other@test.com' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('getUserActivities', () => {
    describe('when there are no activities', () => {
      beforeEach(async () => {
        result = await sut.getUserActivities({ userId: user._id });
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are activities', () => {
      let joinedRoom;
      let createdRoom;
      let favoriteRoom;
      let createdLesson;
      let favoriteLesson;
      let createdDocument;
      let updatedDocument;
      let favoriteDocument;
      let allUserActivities;

      beforeEach(async () => {
        createdDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document' });
        await db.documents.updateOne({ _id: createdDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:00:00.000Z')
          }
        });

        updatedDocument = await createTestDocument(container, otherUser, { title: 'Created document [other]' });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            updatedBy: user._id,
            title: 'Updated document',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });

        createdRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room',
          createdOn: new Date('2022-03-09T10:03:00.000Z'),
          updatedOn: new Date('2022-03-09T10:03:00.000Z'),
          members: [{ userId: otherUser._id, joinedOn: new Date('2022-03-09T10:04:00.000Z') }]
        });
        await db.rooms.updateOne({ _id: createdRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Updated room',
            createdOn: new Date('2022-03-09T10:03:00.000Z'),
            updatedOn: new Date('2022-03-09T10:05:00.000Z')
          }
        });

        joinedRoom = await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Created room [other]',
          createdOn: new Date('2022-03-09T10:06:00.000Z'),
          updatedOn: new Date('2022-03-09T10:06:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:07:00.000Z') }]
        });

        createdLesson = await createTestLesson(container, {
          createdBy: user._id,
          title: 'Created lesson',
          createdOn: new Date('2022-03-09T10:08:00.000Z'),
          updatedOn: new Date('2022-03-09T10:08:00.000Z')
        });
        await db.lessons.updateOne({ _id: createdLesson._id }, {
          $set: {
            title: 'Updated lesson',
            createdOn: new Date('2022-03-09T10:08:00.000Z'),
            updatedOn: new Date('2022-03-09T10:09:00.000Z')
          }
        });
        await createTestLesson(container, {
          createdBy: otherUser._id,
          title: 'Created lesson [other]',
          createdOn: new Date('2022-03-09T10:10:00.000Z'),
          updatedOn: new Date('2022-03-09T10:10:00.000Z')
        });

        favoriteRoom = await createTestRoom(container, { name: 'Created popular room [other]', owner: otherUser._id, createdBy: otherUser._id });
        favoriteLesson = await createTestLesson(container, { title: 'Created popular lesson [other]', createdBy: otherUser._id });
        favoriteDocument = await createTestDocument(container, otherUser, { title: 'Created popular document [other]' });
        await db.users.updateOne({ _id: user._id }, {
          $set: {
            favorites: [
              {
                type: FAVORITE_TYPE.room,
                setOn: new Date('2022-03-09T10:11:00.000Z'),
                id: favoriteRoom._id
              },
              {
                type: FAVORITE_TYPE.lesson,
                setOn: new Date('2022-03-09T10:12:00.000Z'),
                id: favoriteLesson._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:13:00.000Z'),
                id: favoriteDocument._id
              }
            ]
          }
        });

        allUserActivities = [
          {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: new Date('2022-03-09T10:13:00.000Z'),
            data: {
              _id: favoriteDocument._id,
              title: 'Created popular document [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.lessonMarkedFavorite,
            timestamp: new Date('2022-03-09T10:12:00.000Z'),
            data: {
              _id: favoriteLesson._id,
              title: 'Created popular lesson [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomMarkedFavorite,
            timestamp: new Date('2022-03-09T10:11:00.000Z'),
            data: {
              _id: favoriteRoom._id,
              name: 'Created popular room [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.lessonUpdated,
            timestamp: new Date('2022-03-09T10:09:00.000Z'),
            data: {
              _id: createdLesson._id,
              title: 'Updated lesson'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.lessonCreated,
            timestamp: new Date('2022-03-09T10:08:00.000Z'),
            data: {
              _id: createdLesson._id,
              title: 'Updated lesson'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomJoined,
            timestamp: new Date('2022-03-09T10:07:00.000Z'),
            data: {
              _id: joinedRoom._id,
              name: 'Created room [other]'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomUpdated,
            timestamp: new Date('2022-03-09T10:05:00.000Z'),
            data: {
              _id: createdRoom._id,
              name: 'Updated room'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.roomCreated,
            timestamp: new Date('2022-03-09T10:03:00.000Z'),
            data: {
              _id: createdRoom._id,
              name: 'Updated room'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.documentUpdated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            data: {
              _id: updatedDocument._id,
              title: 'Updated document'
            }
          },
          {
            type: USER_ACTIVITY_TYPE.documentCreated,
            timestamp: new Date('2022-03-09T10:00:00.000Z'),
            data: {
              _id: createdDocument._id,
              title: 'Created document'
            }
          }
        ];
      });

      describe('and limit is not set', () => {
        beforeEach(async () => {
          result = await sut.getUserActivities({ userId: user._id });
        });

        it('should return all activities sorted descending', () => {
          expect(result).toEqual(allUserActivities);
        });
      });

      describe('and limit is set to 5', () => {
        beforeEach(async () => {
          result = await sut.getUserActivities({ userId: user._id, limit: 5 });
        });

        it('should return latest 5 activities sorted descending', () => {
          expect(result).toEqual(allUserActivities.splice(0, 5));
        });
      });
    });
  });
});
