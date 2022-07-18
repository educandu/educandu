import by from 'thenby';
import deepEqual from 'fast-deep-equal';
import Cdn from '../repositories/cdn.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import LessonStore from '../stores/lesson-store.js';
import { extractCdnResources } from './section-helper.js';
import PluginRegistry from '../plugins/plugin-registry.js';
import { getPublicHomePath } from '../utils/storage-utils.js';
import { STORAGE_DIRECTORY_MARKER_NAME } from '../domain/constants.js';

class LessonService {
  static get inject() {
    return [Cdn, LessonStore, PluginRegistry];
  }

  constructor(cdn, lessonStore, pluginRegistry) {
    this.cdn = cdn;
    this.lessonStore = lessonStore;
    this.pluginRegistry = pluginRegistry;
  }

  async getLessonById(lessonId) {
    const lesson = await this.lessonStore.getLessonById(lessonId);
    return lesson;
  }

  async getLessonsMetadata(roomId) {
    const lessons = await this.lessonStore.getLessonsMetadataByRoomId(roomId);
    return lessons.sort(by(l => l.dueOn || 0));
  }

  async createLesson({ userId, roomId, title, slug, language, dueOn }) {
    const lessonId = uniqueId.create();

    await this.createUploadDirectoryMarkerForLesson(lessonId);

    const lesson = {
      _id: lessonId,
      roomId,
      createdOn: new Date(),
      createdBy: userId,
      updatedOn: new Date(),
      updatedBy: userId,
      title,
      slug,
      language,
      sections: [],
      cdnResources: [],
      dueOn: new Date(dueOn)
    };

    try {
      await this.lessonStore.saveLesson(lesson);
    } catch (error) {
      await this.deleteUploadDirectoryMarkerForLesson(lessonId);
      throw error;
    }

    return lesson;
  }

  async createUploadDirectoryMarkerForLesson(lessonId) {
    const homePath = getPublicHomePath(lessonId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.uploadEmptyObject(directoryMarkerPath);
  }

  async deleteUploadDirectoryMarkerForLesson(lessonId) {
    const homePath = getPublicHomePath(lessonId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.deleteObject(directoryMarkerPath);
  }

  async updateLessonMetadata(lessonId, { userId, title, slug, language, dueOn }) {
    const lesson = await this.getLessonById(lessonId);

    const updatedLesson = {
      ...lesson,
      title,
      slug: slug || '',
      language,
      dueOn: dueOn ? new Date(dueOn) : null,
      updatedOn: new Date(),
      updatedBy: userId
    };

    await this.lessonStore.saveLesson(updatedLesson);
    return updatedLesson;
  }

  async updateLessonSections(lessonId, { userId, sections }) {
    const lesson = await this.getLessonById(lessonId);

    const updatedLesson = {
      ...lesson,
      sections,
      cdnResources: extractCdnResources(sections, this.pluginRegistry),
      updatedOn: new Date(),
      updatedBy: userId
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
      cdnResources: extractCdnResources(lesson.sections, this.pluginRegistry)
    };

    if (!deepEqual(lesson, updatedLesson)) {
      await this.lessonStore.saveLesson(updatedLesson);
    }
  }
}

export default LessonService;
