import HttpClient from './http-client.js';

class BatchApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getBatch(batchId) {
    return this.httpClient
      .get(
        `/api/v1/batches/${encodeURIComponent(batchId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default BatchApiClient;

