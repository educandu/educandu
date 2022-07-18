import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import LessonService from './lesson-service.js';
import MarkdownInfo from '../plugins/markdown/markdown-info.js';
import { createTestLesson, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('lesson-service', () => {
  let container;

  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    sut = container.get(LessonService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  describe('getLessonsMetadata', () => {
    let roomId;
    let result;

    beforeEach(async () => {
      roomId = uniqueId.create();

      await createTestLesson(container, { _id: 'lesson1', roomId, dueOn: new Date('2022-05-16T18:04:13.896Z') });
      await createTestLesson(container, { _id: 'lesson2', roomId });
      await createTestLesson(container, { _id: 'lesson3', roomId, dueOn: new Date('2023-04-12T05:00:00.815Z') });
      await createTestLesson(container, { _id: 'lesson4', roomId, dueOn: new Date('2022-06-16T18:04:13.896Z') });

      result = await sut.getLessonsMetadata(roomId);
    });

    it('should return the lessons sorted by dueOn date', () => {
      expect(result.map(l => l._id)).toEqual(['lesson2', 'lesson1', 'lesson4', 'lesson3']);
    });
  });

  describe('consolidateCdnResources', () => {
    let lessonId;
    let markdownInfo;

    beforeEach(() => {
      lessonId = uniqueId.create();
      markdownInfo = container.get(MarkdownInfo);
    });

    describe('when CDN resources are missing', () => {
      let lessonBeforeConsolidation;
      let lessonAfterConsolidation;

      beforeEach(async () => {
        lessonBeforeConsolidation = await createTestLesson(container, {
          _id: lessonId,
          sections: [
            {
              key: uniqueId.create(),
              type: 'markdown',
              content: {
                ...markdownInfo.getDefaultContent(),
                text: '![](cdn://media/some-resource.jpg)',
                renderMedia: true
              }
            }
          ],
          cdnResources: []
        });

        await sut.consolidateCdnResources(lessonId);

        lessonAfterConsolidation = await db.lessons.findOne({ _id: lessonId });
      });

      it('should add the missing resources', () => {
        expect(lessonAfterConsolidation).not.toStrictEqual(lessonBeforeConsolidation);
        expect(lessonAfterConsolidation.cdnResources).toStrictEqual(['media/some-resource.jpg']);
      });
    });

    describe('when no CDN resources are missing', () => {
      let lessonBeforeConsolidation;
      let lessonAfterConsolidation;

      beforeEach(async () => {
        lessonBeforeConsolidation = await createTestLesson(container, {
          _id: lessonId,
          sections: [
            {
              key: uniqueId.create(),
              type: 'markdown',
              content: {
                ...markdownInfo.getDefaultContent(),
                text: '![](cdn://media/some-resource.jpg)',
                renderMedia: true
              }
            }
          ],
          cdnResources: ['media/some-resource.jpg']
        });

        await sut.consolidateCdnResources(lessonId);

        lessonAfterConsolidation = await db.lessons.findOne({ _id: lessonId });
      });

      it('should not modify the lesson', () => {
        expect(lessonAfterConsolidation).toStrictEqual(lessonBeforeConsolidation);
      });
    });
  });

});
