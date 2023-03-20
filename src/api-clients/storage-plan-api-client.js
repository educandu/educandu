import HttpClient from './http-client.js';

class StoragePlanApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getAllStoragePlans(includeAssignedUserCount = false) {
    return this.httpClient
      .get(
        `/api/v1/storage-plans?includeAssignedUserCount=${!!includeAssignedUserCount}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createStoragePlan({ name, maxBytes }) {
    return this.httpClient
      .post(
        '/api/v1/storage-plans',
        { name, maxBytes },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateStoragePlan({ storagePlanId, name, maxBytes }) {
    return this.httpClient
      .patch(
        `/api/v1/storage-plans/${encodeURIComponent(storagePlanId)}`,
        { name, maxBytes },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteStoragePlan(storagePlanId) {
    return this.httpClient
      .delete(
        `/api/v1/storage-plans/${encodeURIComponent(storagePlanId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default StoragePlanApiClient;
