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

  getLatestBatches() {
    return this.httpClient
      .get(
        '/api/v1/latest-batches',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  postBatchRequest(batchType) {
    return this.httpClient
      .post(
        `/api/v1/batch-request/${encodeURIComponent(batchType)}`,
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default BatchApiClient;

