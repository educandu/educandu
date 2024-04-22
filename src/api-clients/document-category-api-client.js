import HttpClient from './http-client.js';

class DocumentCategoryApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  requestCreation({ name, description }) {
    return this.httpClient
      .post(
        '/api/v1/document-categories/request-creation',
        { name, description },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentCategoryApiClient;
