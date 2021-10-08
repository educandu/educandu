import HttpClient from './http-client';

class UserApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getUsers() {
    return this.httpClient
      .get('/api/v1/users')
      .accept('json')
      .then(res => res.body);
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

  saveUserRoles({ userId, roles }) {
    return this.httpClient
      .post(`/api/v1/users/${userId}/roles`)
      .type('json')
      .accept('json')
      .send({ roles })
      .then(res => res.body);
  }

  saveUserAccount({ username, email }) {
    return this.httpClient
      .post('/api/v1/users/account')
      .type('json')
      .accept('json')
      .send({ username, email })
      .then(res => res.body);
  }

  saveUserProfile({ profile }) {
    return this.httpClient
      .post('/api/v1/users/profile')
      .type('json')
      .accept('json')
      .send({ profile })
      .then(res => res.body);
  }

  saveUserLockedOutState({ userId, lockedOut }) {
    return this.httpClient
      .post(`/api/v1/users/${userId}/lockedOut`)
      .type('json')
      .accept('json')
      .send({ lockedOut })
      .then(res => res.body);
  }
}

export default UserApiClient;
