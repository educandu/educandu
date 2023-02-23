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

  createMediaLibraryItem({ file, description, languages, licenses, tags, onProgress = () => {} }) {
    const formData = new FormData();
    languages.forEach(language => formData.append('languages[]', language));
    licenses.forEach(license => formData.append('licenses[]', license));
    tags.forEach(tag => formData.append('tags[]', tag));
    formData.append('description', description);
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

  updateMediaLibraryItem({ mediaLibraryItemId, description, languages, licenses, tags }) {
    return this.httpClient
      .patch(
        `/api/v1/media-library/items/${encodeURIComponent(mediaLibraryItemId)}`,
        { description, languages, licenses, tags },
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

  getMediaLibraryTagSuggestions(query) {
    return this.httpClient
      .get(
        `/api/v1/media-library/tags?query=${encodeURIComponent(query)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default MediaLibraryApiClient;
