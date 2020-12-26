import HttpClient from './http-client';

class CdnApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getObjects(prefix) {
    return this.httpClient
      .get(`/api/v1/cdn/objects?prefix=${prefix}`)
      .accept('json')
      .then(res => res.body);
  }

  uploadFiles(files, prefix, { onProgress = () => {} } = {}) {
    const request = this.httpClient
      .post('/api/v1/cdn/objects')
      .accept('json')
      .field('prefix', prefix)
      .on('progress', onProgress);

    files.forEach(file => {
      request.attach('files', file, file.name);
    });

    return request.then(res => res.body);
  }
}

export default CdnApiClient;
