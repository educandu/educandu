import HttpClient from './http-client.js';

class DocumentApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  postDocumentRegenerationRequest() {
    return this.httpClient
      .post(
        '/api/v1/admin/document-regeneration',
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentApiClient;
