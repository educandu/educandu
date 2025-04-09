import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';

class MediaLibraryApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  queryMediaLibraryItems({ query, resourceTypes }) {
    return this.httpClient
      .get(
        `/api/v1/media-library/items?${urlUtils.composeQueryString({ query, resourceTypes })}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  findMediaLibraryItem({ url }) {
    return this.httpClient
      .get(
        `/api/v1/media-library/items/${encodeURIComponent(url)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  createMediaLibraryItem({ file, shortDescription, languages, allRightsReserved, licenses, tags, onProgress = () => {} }) {
    const formData = new FormData();
    formData.append('metadata', JSON.stringify({ shortDescription, languages, allRightsReserved, licenses, tags }));
    formData.append('file', file, file.name);

    const request = this.httpClient
      .post(
        '/api/v1/media-library/items',
        formData,
        {
          responseType: 'json',
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress
        }
      );

    return request.then(res => res.data);
  }

  updateMediaLibraryItem({ mediaLibraryItemId, shortDescription, languages, allRightsReserved, licenses, tags }) {
    return this.httpClient
      .patch(
        `/api/v1/media-library/items/${encodeURIComponent(mediaLibraryItemId)}`,
        { shortDescription, languages, allRightsReserved, licenses, tags },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteMediaLibraryItem({ mediaLibraryItemId }) {
    return this.httpClient
      .delete(
        `/api/v1/media-library/items/${encodeURIComponent(mediaLibraryItemId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  bulkDeleteMediaLibraryItems({ mediaLibraryItemIds }) {
    return this.httpClient
      .delete(
        '/api/v1/media-library/items',
        {
          data: { mediaLibraryItemIds },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  getMediaLibraryTagSuggestions(query) {
    return this.httpClient
      .get(
        `/api/v1/media-library/tags?query=${encodeURIComponent(query)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getContentManagementMediaLibraryItems() {
    return this.httpClient
      .get(
        '/api/v1/media-library/items/content-management',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getStatisticsMediaLibraryItems() {
    return this.httpClient
      .get(
        '/api/v1/media-library/items/statistics',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default MediaLibraryApiClient;
