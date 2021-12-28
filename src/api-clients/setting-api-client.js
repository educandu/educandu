import HttpClient from './http-client.js';

class SettingApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveSettings({ settings }) {
    return this.httpClient
      .post(
        '/api/v1/settings',
        { settings },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default SettingApiClient;
