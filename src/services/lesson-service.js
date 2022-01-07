import Logger from '../common/logger.js';
import LessonStore from '../stores/lesson-store.js';

const logger = new Logger(import.meta.url);

class LessonService {
  static get inject() {
    return [LessonStore];
  }

  constructor(lessonStore) {
    this.lessonStore = lessonStore;
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
}

export default LessonService;
