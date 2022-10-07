import HttpClient from './http-client.js';

class ImportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getImports(hostName) {
    return this.httpClient
      .get(
        '/api/v1/imports',
        {
          params: { hostName },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  postImport({ hostName, documentsToImport, nativeImport }) {
    return this.httpClient
      .post(
        '/api/v1/imports',
        { hostName, documentsToImport, nativeImport },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default ImportApiClient;

