import HttpClient from './http-client.js';
import Database from '../stores/database.js';
import { API_KEY_HEADER } from '../domain/api-key-strategy.js';

class ExportApiClient {
  static inject() { return [HttpClient, Database]; }

  constructor(httpClient, database) {
    this.httpClient = httpClient;
    this.database = database;
  }

  async getExports({ baseUrl, apiKey }) {
    const databaseSchemaHash = await this.database.getSchemaHash();

    return this.httpClient
      .get(`${baseUrl}/api/v1/exports`)
      .query({ databaseSchemaHash })
      .set(API_KEY_HEADER, apiKey)
      .accept('json')
      .then(res => res.body);
  }

  async getDocumentExport({ baseUrl, apiKey, documentKey, fromRevision, toRevision }) {
    const databaseSchemaHash = await this.database.getSchemaHash();

    return this.httpClient
      .get(`${baseUrl}/api/v1/exports/${encodeURIComponent(documentKey)}`)
      .query({ fromRevision, toRevision, databaseSchemaHash })
      .set(API_KEY_HEADER, apiKey)
      .accept('json')
      .then(res => res.body);
  }
}

export default ExportApiClient;
