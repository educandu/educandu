import HttpClient from './http-client.js';

class RecentContributionsApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getDocuments({ page, pageSize }) {
    const queryString = `page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`;
    return this.httpClient
      .get(
        `/api/v1/recent-contributions/documents?${queryString}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getMediaLibraryItems({ page, pageSize }) {
    const queryString = `page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`;
    return this.httpClient
      .get(
        `/api/v1/recent-contributions/media-library-items?${queryString}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default RecentContributionsApiClient;
