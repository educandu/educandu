import HttpClient from './http-client.js';

class LessonApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addLesson({ title, slug, language }) {
    return this.httpClient
      .post(
        '/api/v1/lessons',
        { title, slug, language },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default LessonApiClient;
