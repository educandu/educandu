import HttpClient from './http-client.js';

class SettingsApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getSettings() {
    return this.httpClient
      .get(
        '/api/v1/settings',
        { responseType: 'json' }
      )
      .then(res => res.data);
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

export default SettingsApiClient;
