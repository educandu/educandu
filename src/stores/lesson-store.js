import Database from './database.js';
import StoreBase from './store-base.js';
import { validate } from '../domain/validation.js';
import { lessonDBSchema } from '../domain/schemas/lesson-schemas.js';

class LessonStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.lessons);
  }

  save(item, options = {}) {
    validate(item, lessonDBSchema);
    return super.save(item, options);
  }

  saveMany(items) {
    items.forEach(item => validate(item, lessonDBSchema));
    return super.saveMany(items);
  }
}

export default LessonStore;
