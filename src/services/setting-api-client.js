const HttpClient = require('./http-client');

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

module.exports = SettingApiClient;
