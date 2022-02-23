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
      title: 'title 1',
      slug: '0123-123',
      language: 'en',
      sections: [],
      cdnResources: [],
      schedule: null
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

    it('should throw on an invalid lesson', () => {
      const invalidLesson = {
        ...validLesson
      };

      delete invalidLesson.createdBy;

      expect(() => sut.saveLesson(invalidLesson)).rejects.toThrow();
    });
  });

  describe('saveLessons', () => {
    it('should save an array of valid lessons', async () => {
      const anotherKey = uniqueId.create();
      const validLesson2 = {
        ...validLesson,
        _id: anotherKey,
        title: 'title 2'
      };

      await sut.saveLessons([validLesson, validLesson2]);

      const savedItems = await sut.getLessonsById([testLessonKey, anotherKey]);
      savedItems.sort((a, b) => a.title > b.title ? 1 : -1);

      expect([validLesson, validLesson2]).toEqual(savedItems);

    });

    it('should throw on an array with an invalid lesson', () => {
      const invalidLesson = {
        ...validLesson
      };

      delete invalidLesson.createdBy;

      expect(() => sut.saveLessons([invalidLesson, validLesson])).rejects.toThrow();
    });
  });

});
