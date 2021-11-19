
import HttpClient from './http-client.js';

// ToDo: remove mock when source provides valid key
const mockDocuments = [
  {
    key: 'aZhbdGbTAt1435U5tswQNo',
    order: 1,
    revision: 'qSBM724q1tvZJvM5yJNbeK',
    updatedOn: new Date('2021-11-19T09:25:07.426Z'),
    title: 'Neues Dokument',
    slug: 'some slug',
    language: 'de'
  }
];
class ExportApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getExports({ baseUrl, apiKey }) {
    return mockDocuments
      || this.httpClient
        .get(`${baseUrl}/api/v1/exports`)
        .set('X-API-Key', apiKey)
        .accept('json')
        .then(res => res.body);
  }
}

export default ExportApiClient;
