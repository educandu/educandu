/* eslint-disable max-lines */
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

    describe('when there are more \'document-created\' activities than the set limit', () => {
      let latestCreatedDocument;

      beforeEach(async () => {
        const firstCreatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document 1' });
        await db.documents.updateOne({ _id: firstCreatedDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:00:00.000Z')
          }
        });
        latestCreatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document 2' });
        await db.documents.updateOne({ _id: latestCreatedDocument._id }, {
          $set: {
            createdOn: new Date('2022-03-09T10:01:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created documents', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentCreated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            data: {
              _id: latestCreatedDocument._id,
              title: 'Created document 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'document-updated\' activities than the set limit', () => {
      let updatedDocument;

      beforeEach(async () => {
        updatedDocument = await createTestDocument(container, user, { createdBy: user._id, title: 'Created document' });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            title: 'Document update 1',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });
        await db.documents.updateOne({ _id: updatedDocument._id }, {
          $set: {
            title: 'Document update 2',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:02:00.000Z')
          }
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest updated documents', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentUpdated,
            timestamp: new Date('2022-03-09T10:02:00.000Z'),
            data: {
              _id: updatedDocument._id,
              title: 'Document update 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-created\' activities than the set limit', () => {
      let latestCreatedRoom;

      beforeEach(async () => {
        await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 1',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        latestCreatedRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 2',
          createdOn: new Date('2022-03-09T10:01:00.000Z'),
          updatedOn: new Date('2022-03-09T10:01:00.000Z')
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomCreated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            data: {
              _id: latestCreatedRoom._id,
              name: 'Created room 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-updated\' activities than the set limit', () => {
      let updatedRoom;

      beforeEach(async () => {
        updatedRoom = await createTestRoom(container, {
          owner: user._id,
          createdBy: user._id,
          name: 'Created room 1',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        await db.rooms.updateOne({ _id: updatedRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Room update 1',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });
        await db.rooms.updateOne({ _id: updatedRoom._id }, {
          $set: {
            updatedBy: user._id,
            name: 'Room update 2',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:02:00.000Z')
          }
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest updated rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomUpdated,
            timestamp: new Date('2022-03-09T10:02:00.000Z'),
            data: {
              _id: updatedRoom._id,
              name: 'Room update 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'room-joined\' activities than the set limit', () => {
      let latestJoinedRoom;

      beforeEach(async () => {
        await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Joined room 1',
          createdOn: new Date('2022-03-09T10:02:00.000Z'),
          updatedOn: new Date('2022-03-09T10:02:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:03:00.000Z') }]
        });
        latestJoinedRoom = await createTestRoom(container, {
          owner: otherUser._id,
          createdBy: otherUser._id,
          name: 'Joined room 2',
          createdOn: new Date('2022-03-09T10:01:00.000Z'),
          updatedOn: new Date('2022-03-09T10:01:00.000Z'),
          members: [{ userId: user._id, joinedOn: new Date('2022-03-09T10:04:00.000Z') }]
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest joined rooms', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.roomJoined,
            timestamp: new Date('2022-03-09T10:04:00.000Z'),
            data: {
              _id: latestJoinedRoom._id,
              name: 'Joined room 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'lesson-created\' activities than the set limit', () => {
      let latestCreatedLesson;

      beforeEach(async () => {
        await createTestLesson(container, {
          createdBy: user._id,
          title: 'Created lesson 1',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        latestCreatedLesson = await createTestLesson(container, {
          createdBy: user._id,
          title: 'Created lesson 2',
          createdOn: new Date('2022-03-09T10:01:00.000Z'),
          updatedOn: new Date('2022-03-09T10:01:00.000Z')
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created lessons', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.lessonCreated,
            timestamp: new Date('2022-03-09T10:01:00.000Z'),
            data: {
              _id: latestCreatedLesson._id,
              title: 'Created lesson 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'lesson-updated\' activities than the set limit', () => {
      let updatedLesson;

      beforeEach(async () => {
        updatedLesson = await createTestLesson(container, {
          createdBy: user._id,
          title: 'Created lesson',
          createdOn: new Date('2022-03-09T10:00:00.000Z'),
          updatedOn: new Date('2022-03-09T10:00:00.000Z')
        });
        await db.lessons.updateOne({ _id: updatedLesson._id }, {
          $set: {
            title: 'Lesson update 1',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:01:00.000Z')
          }
        });
        await db.lessons.updateOne({ _id: updatedLesson._id }, {
          $set: {
            title: 'Lesson update 2',
            createdOn: new Date('2022-03-09T10:00:00.000Z'),
            updatedOn: new Date('2022-03-09T10:02:00.000Z')
          }
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest created lessons', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.lessonUpdated,
            timestamp: new Date('2022-03-09T10:02:00.000Z'),
            data: {
              _id: updatedLesson._id,
              title: 'Lesson update 2'
            }
          }
        ]);
      });
    });

    describe('when there are more \'marked-as-favorite\' activities than the set limit', () => {
      let latestFavorite;

      beforeEach(async () => {
        const favorite1 = await createTestRoom(container, { name: 'Favorite 1', owner: otherUser._id, createdBy: otherUser._id });
        const favorite2 = await createTestLesson(container, { title: 'Favorite 2', createdBy: otherUser._id });
        latestFavorite = await createTestDocument(container, otherUser, { title: 'Favorite 3' });
        await db.users.updateOne({ _id: user._id }, {
          $set: {
            favorites: [
              {
                type: FAVORITE_TYPE.room,
                setOn: new Date('2022-03-09T10:01:00.000Z'),
                id: favorite1._id
              },
              {
                type: FAVORITE_TYPE.lesson,
                setOn: new Date('2022-03-09T10:02:00.000Z'),
                id: favorite2._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:03:00.000Z'),
                id: latestFavorite._id
              }
            ]
          }
        });

        result = await sut.getUserActivities({ userId: user._id, limit: 1 });
      });

      it('should return only the latest items marked as favorite', () => {
        expect(result).toEqual([
          {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: new Date('2022-03-09T10:03:00.000Z'),
            data: {
              _id: latestFavorite._id,
              title: 'Favorite 3'
            }
          }
        ]);
      });
    });
  });

  describe('getUserFavorites', () => {
    describe('when there are no favorites', () => {
      beforeEach(async () => {
        result = await sut.getUserFavorites(user._id);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there favorites', () => {
      let document;
      let room;
      let lesson;

      beforeEach(async () => {
        room = await createTestRoom(container, { name: 'Favorite room' });
        lesson = await createTestLesson(container, { title: 'Favorite lesson' });
        document = await createTestDocument(container, user, { title: 'Favorite document' });
        await db.users.updateOne({ _id: user._id }, {
          $set: {
            favorites: [
              {
                type: FAVORITE_TYPE.room,
                setOn: new Date('2022-03-09T10:01:00.000Z'),
                id: room._id
              },
              {
                type: FAVORITE_TYPE.lesson,
                setOn: new Date('2022-03-09T10:02:00.000Z'),
                id: lesson._id
              },
              {
                type: FAVORITE_TYPE.document,
                setOn: new Date('2022-03-09T10:03:00.000Z'),
                id: document._id
              }
            ]
          }
        });
        result = await sut.getUserFavorites(user._id);
      });

      it('should return an array containing the user favorites', () => {
        expect(result).toEqual([
          {
            id: room._id,
            type: FAVORITE_TYPE.room,
            setOn: new Date('2022-03-09T10:01:00.000Z'),
            title: 'Favorite room'
          },
          {
            id: lesson._id,
            type: FAVORITE_TYPE.lesson,
            setOn: new Date('2022-03-09T10:02:00.000Z'),
            title: 'Favorite lesson'
          },
          {
            id: document._id,
            type: FAVORITE_TYPE.document,
            setOn: new Date('2022-03-09T10:03:00.000Z'),
            title: 'Favorite document'
          }
        ]);
      });
    });
  });
});
