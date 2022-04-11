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

  getAllLessonIds() {
    return this.collection.distinct('_id');
  }

  getLessonMetadataById(lessonId, { session } = {}) {
    return this.collection.findOne({ _id: lessonId }, { projection: lessonMetadataProjection, session });
  }

  getLessonsMetadataByIds(lessonIds, { session } = {}) {
    return this.collection.find({ _id: { $in: lessonIds } }, { session }).toArray();
  }

  getLessonsById(lessonIds, { session } = {}) {
    return this.collection.find({ _id: { $in: lessonIds } }, { session }).toArray();
  }

  getLessonsMetadataByRoomId(roomId, { session } = {}) {
    return this.collection.find({ roomId }, { projection: lessonMetadataProjection, session }).toArray();
  }

  getLatestLessonsMetadataCreatedByUser(createdBy, { session, limit } = {}) {
    return this.collection.find({ createdBy }, { projection: lessonMetadataProjection, session })
      .sort({ updatedOn: -1 }).limit(limit || 0).toArray();
  }

  async saveLesson(lesson, { session } = {}) {
    validate(lesson, lessonDBSchema);
    const result = await this._saveLesson(lesson, { session });
    return result;
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
