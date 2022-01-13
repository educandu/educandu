import HttpClient from './http-client.js';

class LessonApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addLesson({ title, slug, language, schedule }) {
    return this.httpClient
      .post(
        '/api/v1/lessons',
        { title, slug, language, schedule },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default LessonApiClient;
