import HttpClient from './http-client.js';

class SettingApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveSettings({ settings }) {
    return this.httpClient
      .post('/api/v1/settings')
      .type('json')
      .accept('json')
      .send({ settings })
      .then(res => res.body);
  }
}

export default SettingApiClient;
