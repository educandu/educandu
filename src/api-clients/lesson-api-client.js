import HttpClient from './http-client.js';

class LessonApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addLesson({ roomId, title, slug, language, schedule }) {
    return this.httpClient
      .post(
        '/api/v1/lessons',
        { roomId, title, slug, language, schedule },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateLessonMetadata({ lessonId, title, slug, language, schedule }) {
    return this.httpClient
      .patch(
        `/api/v1/lessons/${encodeURIComponent(lessonId)}/metadata`,
        { title, slug, language, schedule },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateLessonSections({ lessonId, sections }) {
    return this.httpClient
      .patch(
        `/api/v1/lessons/${encodeURIComponent(lessonId)}/sections`,
        { sections },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteLesson(lessonId) {
    return this.httpClient
      .delete(
        `/api/v1/lessons/${encodeURIComponent(lessonId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default LessonApiClient;
