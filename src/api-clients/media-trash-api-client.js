import HttpClient from './http-client.js';

class MediaTrashApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getContentManagementMediaTrashItems() {
    return this.httpClient
      .get(
        '/api/v1/media-trash/items/content-management',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteMediaTrashItem({ mediaTrashItemId }) {
    return this.httpClient
      .delete(
        `/api/v1/media-trash/items/${encodeURIComponent(mediaTrashItemId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default MediaTrashApiClient;
