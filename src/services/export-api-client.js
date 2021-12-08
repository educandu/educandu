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
      .get(
        `${baseUrl}/api/v1/exports`,
        {
          params: { databaseSchemaHash },
          headers: { [API_KEY_HEADER]: apiKey },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  async getDocumentExport({ baseUrl, apiKey, documentKey, afterRevision, toRevision }) {
    const databaseSchemaHash = await this.database.getSchemaHash();

    return this.httpClient
      .get(
        `${baseUrl}/api/v1/exports/${encodeURIComponent(documentKey)}`,
        {
          params: { afterRevision, toRevision, databaseSchemaHash },
          headers: { [API_KEY_HEADER]: apiKey },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }
}

export default ExportApiClient;
