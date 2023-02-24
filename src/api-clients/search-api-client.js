import HttpClient from './http-client.js';

export default class SearchApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  search(query) {
    return this.httpClient
      .get(
        `/api/v1/search?query=${encodeURIComponent(query)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}
