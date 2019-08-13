const HttpClient = require('./http-client');

class DocumentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveDocument(doc) {
    return this.httpClient
      .post('/api/v1/docs')
      .accept('json')
      .type('json')
      .send(doc)
      .then(res => res.body);
  }
}

module.exports = DocumentApiClient;
