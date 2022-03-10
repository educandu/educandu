import Database from './database.js';
import { validate } from '../domain/validation.js';
import { lessonDBSchema } from '../domain/schemas/lesson-schemas.js';

const lessonMetadataProjection = {
  _id: 1,
  roomId: 1,
  title: 1,
  slug: 1,
  language: 1,
  schedule: 1,
  createdOn: 1,
  updatedOn: 1
};

class LessonStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.lessons;
  }

  getLessonById(lessonId, { session } = {}) {
    return this.collection.findOne({ _id: lessonId }, { session });
  }

  getLessonMetadataById(lessonId, { session } = {}) {
    return this.collection.findOne({ _id: lessonId }, { projection: lessonMetadataProjection, session });
  }

  getLessonsById(lessonIds, { session } = {}) {
    return this.collection.find({ _id: { $in: lessonIds } }, { session }).toArray();
  }

  getLessonsMetadataByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { projection: lessonMetadataProjection, session }).toArray();
  }

  getLessonsMetadataCreatedByUser(createdBy, { session } = {}) {
    return this.collection.find({ createdBy }, { projection: lessonMetadataProjection, session }).toArray();
  }

  async saveLesson(lesson, { session } = {}) {
    validate(lesson, lessonDBSchema);
    const result = await this._saveLesson(lesson, { session });
    return result;
  }

  async saveLessons(lessons, { session } = {}) {
    lessons.forEach(lesson => validate(lesson, lessonDBSchema));
    await Promise.all(lessons.map(lesson => this._saveLesson(lesson, { session })));
  }

  async deleteLessonsByRoomId(roomId, { session } = {}) {
    await this.collection.deleteMany({ roomId }, { session });
  }

  async deleteLessonById(lessonId, { session } = {}) {
    await this.collection.deleteOne({ _id: lessonId }, { session });
  }

  _saveLesson(lesson, { session }) {
    return this.collection.replaceOne({ _id: lesson._id }, lesson, { session, upsert: true });
  }
}

export default LessonStore;
