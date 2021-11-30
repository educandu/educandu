import HttpClient from './http-client.js';

class ImportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getImports(hostName) {
    return this.httpClient
      .get('/api/v1/imports')
      .query({ hostName })
      .accept('json')
      .then(res => res.body);
  }

  postImportBatch(batch) {
    return this.httpClient
      .post('/api/v1/imports/batch')
      .accept('json')
      .type('json')
      .send(batch)
      .then(res => res.body);
  }
}

export default ImportApiClient;

