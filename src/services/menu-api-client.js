const HttpClient = require('./http-client');

class MenuApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  saveMenu(menu) {
    return this.httpClient
      .post('/api/v1/menus')
      .accept('json')
      .type('json')
      .send(menu)
      .then(res => res.body);
  }
}

module.exports = MenuApiClient;
