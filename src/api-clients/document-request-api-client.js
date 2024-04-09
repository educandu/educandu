import HttpClient from './http-client.js';

class DocumentRequestApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getMaintenanceDocumentRequests() {
    return this.httpClient
      .get(
        '/api/v1/document-requests/maintenance',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default DocumentRequestApiClient;
