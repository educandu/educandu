import HttpClient from './http-client.js';
import Database from '../stores/database.js';
import { API_KEY_HEADER } from '../domain/api-key-strategy.js';

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
  static inject() { return [HttpClient, Database]; }

  constructor(httpClient, database) {
    this.httpClient = httpClient;
    this.database = database;
  }

  getExports({ baseUrl, apiKey }) {
    return mockDocuments
      || this.httpClient
        .get(`${baseUrl}/api/v1/exports`)
        .query({ databaseSchemaHash: this.database.schemaHash })
        .set(API_KEY_HEADER, apiKey)
        .accept('json')
        .then(res => res.body);
  }
}

export default ExportApiClient;
