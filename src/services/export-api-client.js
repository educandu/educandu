
import HttpClient from './http-client.js';

const mockDocuments = [
  {
    key: 'aZhbdGbTAt1435U5tswQNo',
    order: 1,
    revision: 'qSBM724q1tvZJvM5yJNbeK',
    updatedOn: new Date('2021-11-19T09:25:07.426Z'),
    title: 'Document 1',
    slug: 'doc-1',
    language: 'de'
  },
  {
    key: '6guxo8JN6o3spyx6Gm9beg',
    order: 2,
    revision: 'sEJsQki8v15wQG7zQDutQ4',
    updatedOn: new Date('2021-11-22T13:24:51.936Z'),
    title: 'Document 2',
    slug: 'doc-2',
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
