import HttpClient from './http-client.js';

class ExportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getExportableDocumentsMetadata({ baseUrl, apiKey }) {
    return this.httpClient
      .get(`${baseUrl}/api/v1/exports`)
      .set('X-API-Key', apiKey)
      .accept('json')
      .then(res => res.body);
  }
}

export default ExportApiClient;
