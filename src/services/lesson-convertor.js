/* eslint-disable no-console */
import UserService from './user-service.js';
import Database from '../stores/database.js';
import DocumentService from './document-service.js';

class LessonConvertor {
  static get inject() {
    return [Database, UserService, DocumentService];
  }

  constructor(db, userService, documentService) {
    this.db = db;
    this.userService = userService;
    this.documentService = documentService;
  }

  async convertAllLessonsToDocuments() {
    console.log('Converting lessons to documents ...');
    const documentIds = await this.db.documentRevisions.distinct('documentId');
    const notConvertedLessons = await this.db.lessons.find({ _id: { $nin: documentIds } }).toArray();

    for (const lesson of notConvertedLessons) {
      // eslint-disable-next-line no-await-in-loop
      const user = await this.userService.getUserById(lesson.createdBy);

      const data = {
        roomId: lesson.roomId,
        createdOn: lesson.createdOn,
        createdBy: lesson.createdBy,
        dueOn: lesson.schedule?.startsOn,
        title: lesson.title,
        slug: lesson.slug,
        language: lesson.language,
        sections: lesson.sections
      };

      // eslint-disable-next-line no-await-in-loop
      const newDocument = await this.documentService.createDocument({ data, user, fromLessonId: lesson._id });
      console.log(`Converted lesson ${lesson._id} to document ${newDocument._id}`);
    }

    console.log(`Converted ${notConvertedLessons.length} lessons to documents.`);
  }
}

export default LessonConvertor;
