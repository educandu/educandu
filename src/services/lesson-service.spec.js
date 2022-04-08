import uniqueId from '../utils/unique-id.js';
import Database from '../stores/database.js';
import LessonService from './lesson-service.js';
import MarkdownInfo from '../plugins/markdown/info.js';
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
