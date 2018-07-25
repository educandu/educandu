const HttpClient = require('./http-client');

class UserApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  register({ username, password, email }) {
    return this.httpClient
      .post('/api/v1/users')
      .type('json')
      .accept('json')
      .send({ username, password, email })
      .then(res => res.body);
  }

  requestPasswordReset({ email }) {
    return this.httpClient
      .post('/api/v1/users/request-password-reset')
      .type('json')
      .accept('json')
      .send({ email })
      .then(res => res.body);
  }

  completePasswordReset({ passwordResetRequestId, password }) {
    return this.httpClient
      .post('/api/v1/users/complete-password-reset')
      .type('json')
      .accept('json')
      .send({ passwordResetRequestId, password })
      .then(res => res.body);
  }

  login({ username, password }) {
    return this.httpClient
      .post('/api/v1/users/login')
      .type('json')
      .accept('json')
      .send({ username, password })
      .then(res => res.body);
  }
}

module.exports = UserApiClient;
