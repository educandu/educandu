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
}

export default StatisticsApiClient;
