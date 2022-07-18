import LessonStore from './lesson-store.js';
import uniqueId from '../utils/unique-id.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('lesson-store', () => {
  let sut;
  let container;
  let testLessonKey;
  let validLesson;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    sut = container.get(LessonStore);
    testLessonKey = uniqueId.create();
    validLesson = {
      _id: testLessonKey,
      roomId: uniqueId.create(),
      createdOn: new Date(),
      createdBy: uniqueId.create(),
      updatedOn: new Date(),
      updatedBy: uniqueId.create(),
      title: 'title 1',
      slug: '0123-123',
      language: 'en',
      sections: [],
      cdnResources: [],
      dueOn: null
    };
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('saveLesson', () => {
    it('should save a valid lesson', async () => {
      await sut.saveLesson(validLesson);

      const savedItem = await sut.getLessonById(testLessonKey);
      expect(savedItem).toEqual(validLesson);
    });

    it('should throw on an invalid lesson', async () => {
      const invalidLesson = {
        ...validLesson
      };

      delete invalidLesson.createdBy;

      await expect(() => sut.saveLesson(invalidLesson)).rejects.toThrow();
    });
  });
});
