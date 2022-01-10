import HttpClient from './http-client.js';

class LessonApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addLesson({ name, access }) {
    return this.httpClient
      .post(
        '/api/v1/lessons',
        { name, access },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default LessonApiClient;
