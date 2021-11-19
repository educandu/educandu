import HttpClient from './http-client.js';

class ExportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getExportableDocumentsMetadata(baseUrl, key) {
    return this.httpClient
      .get('baseUrl/api/v1/exports')
      .query({ key })
      .accept('json')
      .then(res => res.body);
  }
}

export default ExportApiClient;
