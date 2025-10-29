import HttpClient from './http-client.js';

class StatisticsApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getTags() {
    return this.httpClient
      .get(
        '/api/v1/statistics/tags',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getTagDetails({ tag }) {
    return this.httpClient
      .get(
        `/api/v1/statistics/tags/${encodeURIComponent(tag)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getStatisticsDocumentRequests({ registeredFrom, registeredUntil, daysOfWeek }) {
    return this.httpClient
      .get(
        '/api/v1/statistics/document-requests',
        {
          params: { registeredFrom, registeredUntil, daysOfWeek },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  getSearchRequests() {
    return this.httpClient
      .get(
        '/api/v1/statistics/search-requests',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getUserContributions({ contributedFrom, contributedUntil }) {
    return this.httpClient
      .get(
        '/api/v1/statistics/user-contributions',
        {
          params: { contributedFrom, contributedUntil },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }

  getUserContributionsDetails({ userId, contributedFrom, contributedUntil }) {
    return this.httpClient
      .get(
        `/api/v1/statistics/user-contributions/${encodeURIComponent(userId)}`,
        {
          params: { contributedFrom, contributedUntil },
          responseType: 'json'
        }
      )
      .then(res => res.data);
  }
}

export default StatisticsApiClient;
