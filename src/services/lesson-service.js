import by from 'thenby';
import deepEqual from 'fast-deep-equal';
import uniqueId from '../utils/unique-id.js';
import LessonStore from '../stores/lesson-store.js';
import InfoFactory from '../plugins/info-factory.js';
import { extractCdnResources } from './section-helper.js';

class LessonService {
  static get inject() {
    return [LessonStore, InfoFactory];
  }

  constructor(lessonStore, infoFactory) {
    this.lessonStore = lessonStore;
    this.infoFactory = infoFactory;
  }

  async getLessonById(lessonId) {
    const lesson = await this.lessonStore.getLessonById(lessonId);
    return lesson;
  }

  async getLessonsMetadata(roomId) {
    const lessons = await this.lessonStore.getLessonsMetadataByRoomId(roomId);
    return lessons.sort(by(l => l.schedule?.startsOn || ''));
  }

  async createLesson({ user, roomId, title, slug, language, schedule }) {
    const mappedSchedule = schedule
      ? {
        startsOn: new Date(schedule.startsOn)
      }
      : null;

    const lesson = {
      _id: uniqueId.create(),
      roomId,
      createdOn: new Date(),
      createdBy: user._id,
      updatedOn: new Date(),
      title,
      slug,
      language,
      sections: [],
      cdnResources: [],
      schedule: mappedSchedule
    };

    await this.lessonStore.saveLesson(lesson);

    return lesson;
  }

  async updateLessonMetadata(lessonId, { title, slug, language, schedule }) {
    const lesson = await this.getLessonById(lessonId);

    const mappedSchedule = schedule
      ? { startsOn: new Date(schedule.startsOn) }
      : null;

    const updatedLesson = {
      ...lesson,
      title,
      slug: slug || '',
      language,
      schedule: mappedSchedule,
      updatedOn: new Date()
    };

    await this.lessonStore.saveLesson(updatedLesson);
    return updatedLesson;
  }

  async updateLessonSections(lessonId, { sections }) {
    const lesson = await this.getLessonById(lessonId);

    const updatedLesson = {
      ...lesson,
      sections,
      cdnResources: extractCdnResources(sections, this.infoFactory),
      updatedOn: new Date()
    };

    await this.lessonStore.saveLesson(updatedLesson);
    return updatedLesson;
  }

  async deleteLessonById(lessonId) {
    await this.lessonStore.deleteLessonById(lessonId);
  }

  async consolidateCdnResources(lessonId) {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson) {
      throw new Error('HÄ?', lessonId);
    }

    const updatedLesson = {
      ...lesson,
      cdnResources: extractCdnResources(lesson.sections, this.infoFactory)
    };

    if (!deepEqual(lesson, updatedLesson)) {
      await this.lessonStore.saveLesson(updatedLesson);
    }
  }
}

export default LessonService;
