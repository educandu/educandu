import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';

class StorageApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getCdnObjects({ parentPath }) {
    return this.httpClient
      .get(
        `/api/v1/storage/objects?${urlUtils.composeQueryString({ parentPath })}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  uploadFiles(files, parentPath, { onProgress = () => {} } = {}) {
    const formData = new FormData();

    formData.set('parentPath', parentPath);
    files.forEach(file => formData.append('files', file, file.name));

    const request = this.httpClient
      .post(
        '/api/v1/storage/objects',
        formData,
        {
          responseType: 'json',
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress
        }
      );

    return request.then(res => res.data);
  }

  deleteCdnObject(path) {
    return this.httpClient
      .delete(
        `/api/v1/storage/objects?path=${encodeURIComponent(path)}`,
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

  getRoomMediaOverview() {
    return this.httpClient
      .get(
        '/api/v1/storage/room-media-overview',
        { responseType: 'json' }
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
}

export default StorageApiClient;
