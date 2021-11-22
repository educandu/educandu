import HttpClient from './http-client.js';

class ExportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getImports(importSource) {
    return this.httpClient
      .get('/api/v1/imports')
      .query({
        importSourceName: importSource.name,
        importSourceBaseUrl: importSource.baseUrl,
        importSourceApiKey: importSource.apiKey
      })
      .accept('json')
      .then(res => res.body);
  }
}

export default ExportApiClient;

