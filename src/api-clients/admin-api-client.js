import HttpClient from './http-client.js';

class AdminApiClient {
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

  postCdnResourcesConsolidationRequest() {
    return this.httpClient
      .post(
        '/api/v1/admin/cdn-resources-consolidation',
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default AdminApiClient;
