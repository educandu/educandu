/* eslint-disable max-lines */
import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import LessonConvertor from './lesson-convertor.js';
import { DOCUMENT_ACCESS, DOCUMENT_ORIGIN, IMAGE_SOURCE_TYPE, ROOM_ACCESS } from '../domain/constants.js';
import { createTestRoom, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('lesson-convertor', () => {
  const sandbox = sinon.createSandbox();
  const now = new Date();

  let container;
  let lesson;
  let room;
  let user;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    db = container.get(Database);

    user = await setupTestUser(container);
    room = await createTestRoom(container, { access: ROOM_ACCESS.private });

    await db.lessons.insertOne({
      _id: uniqueId.create(),
      roomId: room._id,
      createdOn: now,
      createdBy: user._id,
      updatedOn: new Date('2022-05-22T10:15:00.573Z'),
      updatedBy: uniqueId.create(),
      title: 'Lesson to migrate',
      slug: 'lesson-to-migrate',
      language: 'en',
      sections: [
        {
          revision: uniqueId.create(),
          key: uniqueId.create(),
          deletedOn: null,
          deletedBy: null,
          deletedBecause: null,
          type: 'image',
          content: {
            sourceType: IMAGE_SOURCE_TYPE.internal,
            sourceUrl: 'media/image-1.png',
            effect: {
              sourceType: IMAGE_SOURCE_TYPE.internal,
              sourceUrl: 'media/image-2.png'
            }
          }
        }
      ],
      cdnResources: [],
      schedule: {
        startsOn: new Date('2022-06-22T10:15:00.573Z')
      }
    });
    lesson = await db.lessons.findOne({});

    sut = container.get(LessonConvertor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('convertAllLessonsToDocuments', () => {
    let documents;
    let revisions;

    beforeAll(async () => {
      await sut.convertAllLessonsToDocuments();
      revisions = await db.documentRevisions.find({}).toArray();
      documents = await db.documents.find({}).toArray();
    });

    it('should have created one document', () => {
      expect(documents).toHaveLength(1);
    });

    it('should have created one revision', () => {
      expect(revisions).toHaveLength(1);
    });

    it('the created document should have all the lesson data and the lesson\'s id', () => {
      expect(documents[0]).toEqual({
        _id: lesson._id,
        revision: revisions[0]._id,
        roomId: lesson.roomId,
        title: lesson.title,
        slug: lesson.slug,
        description: '',
        access: DOCUMENT_ACCESS.private,
        createdOn: lesson.createdOn,
        createdBy: lesson.createdBy,
        updatedOn: lesson.createdOn,
        updatedBy: lesson.createdBy,
        tags: [],
        sections: lesson.sections,
        review: '',
        archived: false,
        contributors: [lesson.createdBy],
        dueOn: lesson.schedule.startsOn,
        language: lesson.language,
        order: 1,
        origin: DOCUMENT_ORIGIN.internal,
        originUrl: '',
        cdnResources: [
          'media/image-1.png',
          'media/image-2.png'
        ]
      });
    });

    it('the created revision should have all the lesson data and the lesson\'s id as documentId', () => {
      expect(revisions[0]).toEqual({
        _id: expect.stringMatching(/\w+/),
        documentId: lesson._id,
        roomId: lesson.roomId,
        title: lesson.title,
        slug: lesson.slug,
        description: '',
        access: DOCUMENT_ACCESS.private,
        createdOn: lesson.createdOn,
        createdBy: lesson.createdBy,
        tags: [],
        sections: lesson.sections,
        review: '',
        archived: false,
        dueOn: lesson.schedule.startsOn,
        language: lesson.language,
        order: 1,
        origin: DOCUMENT_ORIGIN.internal,
        originUrl: '',
        restoredFrom: '',
        cdnResources: [
          'media/image-1.png',
          'media/image-2.png'
        ]
      });
    });
  });

});
