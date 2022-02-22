import HttpClient from './http-client.js';

class StorageApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getObjects(prefix) {
    return this.httpClient
      .get(
        `/api/v1/storage/objects?prefix=${encodeURIComponent(prefix)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  uploadFiles(files, prefix, { onProgress = () => {} } = {}) {
    const formData = new FormData();

    formData.set('prefix', prefix);
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

  deleteCdnObject(prefix, fileName) {
    return this.httpClient
      .delete(
        `/api/v1/storage/objects/${fileName}?prefix=${encodeURIComponent(prefix)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default StorageApiClient;
