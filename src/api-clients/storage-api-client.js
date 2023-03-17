import HttpClient from './http-client.js';

class StorageApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getRoomMediaOverview() {
    return this.httpClient
      .get(
        '/api/v1/storage/room-media-overview',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getAllRoomMedia({ roomId }) {
    return this.httpClient
      .get(
        `/api/v1/storage/room-media/${encodeURIComponent(roomId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  postRoomMedia({ roomId, file }) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.httpClient
      .post(
        `/api/v1/storage/room-media/${encodeURIComponent(roomId)}`,
        formData,
        { responseType: 'json', headers: { 'content-type': 'multipart/form-data' } }
      )
      .then(res => res.data);
  }

  deleteRoomMedia({ roomId, name }) {
    return this.httpClient
      .delete(
        `/api/v1/storage/room-media/${encodeURIComponent(roomId)}/${encodeURIComponent(name)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getAllStoragePlans(includeAssignedUserCount = false) {
    return this.httpClient
      .get(
        `/api/v1/storage/plans?includeAssignedUserCount=${!!includeAssignedUserCount}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createStoragePlan({ name, maxBytes }) {
    return this.httpClient
      .post(
        '/api/v1/storage/plans',
        { name, maxBytes },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateStoragePlan({ storagePlanId, name, maxBytes }) {
    return this.httpClient
      .patch(
        `/api/v1/storage/plans/${encodeURIComponent(storagePlanId)}`,
        { name, maxBytes },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteStoragePlan(storagePlanId) {
    return this.httpClient
      .delete(
        `/api/v1/storage/plans/${encodeURIComponent(storagePlanId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default StorageApiClient;
