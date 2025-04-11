import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';

class SearchRequestApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getStatisticsSearchRequests({ registeredFrom, registeredUntil } = {}) {
    const queryString = urlUtils.composeQueryString({ registeredFrom, registeredUntil });
    return this.httpClient
      .get(
        `/api/v1/search-requests/statistics?${queryString}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default SearchRequestApiClient;
