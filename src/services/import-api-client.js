import HttpClient from './http-client.js';

class ExportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getImports(importSource) {
    const { name, baseUrl, apiKey } = importSource;

    return this.httpClient
      .get('/api/v1/imports')
      .query({ name, baseUrl, apiKey })
      .accept('json')
      .then(res => res.body);
  }
}

export default ExportApiClient;

