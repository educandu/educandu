import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import LessonStore from '../stores/lesson-store.js';

const logger = new Logger(import.meta.url);

class LessonService {
  static get inject() {
    return [LessonStore];
  }

  constructor(lessonStore) {
    this.lessonStore = lessonStore;
  }

  async getLesson(lessonId) {
    const lesson = await Promise.resolve({
      _id: lessonId,
      title: 'Hs Fuge und Konzert im Werk J. S. Bachs',
      slug: 'fuge-und-konzert-bach'
    });

    return lesson;
  }

  async getLessons(roomId) {
    logger.info(`Mocking lessons for room '${roomId}'`);
    const lessons = await Promise.resolve([
      {
        _id: '6oRi271rzMTYp3f3XDg55m',
        title: 'Hs Fuge und Konzert im Werk J. S. Bachs',
        slug: 'fuge-und-konzert-bach'
      },
      {
        _id: '7oRi271rzMTYp3f3XDg55m',
        title: 'Ps (Romantischer) Chorsatz (GMR)'
      },
      {
        _id: '8oRi271rzMTYp3f3XDg55m',
        title: 'Hs Formfunktionen der Sonatenform'
      },
      {
        _id: '9oRi271rzMTYp3f3XDg55m',
        title: 'S Projekt (IM I)'
      },
      {
        _id: '10Ri271rzMTYp3f3XDg55m',
        title: 'Hs Pop-/Rockmusik - Analyse, Stilübung und Didaktik'
      }
    ]);

    return lessons;
  }

  async createLesson({ user, title, slug, language }) {
    const lesson = {
      _id: uniqueId.create(),
      createdOn: new Date(),
      createdBy: user._id,
      updatedOn: new Date(),
      title,
      slug,
      language,
      sections: [],
      cdnResources: [],
      schedule: null
    };

    await this.lessonStore.save(lesson);

    return lesson;
  }
}

export default LessonService;
