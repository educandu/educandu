import by from 'thenby';
import uniqueId from '../utils/unique-id.js';
import LessonStore from '../stores/lesson-store.js';

const roomLessonsProjection = {
  _id: 1,
  roomId: 1,
  title: 1,
  slug: 1,
  language: 1,
  schedule: 1
};

class LessonService {
  static get inject() {
    return [LessonStore];
  }

  constructor(lessonStore) {
    this.lessonStore = lessonStore;
  }

  async getLessonById(lessonId) {
    const lesson = await this.lessonStore.findOne({ _id: lessonId });
    return lesson;
  }

  async getLessons(roomId) {
    const lessons = await this.lessonStore.find({ roomId }, { projection: roomLessonsProjection });
    return lessons.sort(by(l => l.schedule?.startsOn));
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

    await this.lessonStore.save(lesson);

    return lesson;
  }

  async updateLesson(lesson) {
    const mappedSchedule = lesson.schedule
      ? { startsOn: new Date(lesson.schedule.startsOn) }
      : null;

    const updatedLesson = {
      ...lesson,
      slug: lesson.slug || '',
      schedule: mappedSchedule
    };
    await this.lessonStore.save(updatedLesson);
    return updatedLesson;
  }
}

export default LessonService;
