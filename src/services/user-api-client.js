import HttpClient from './http-client.js';

class UserApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getUsers() {
    return this.httpClient
      .get(
        '/api/v1/users',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  register({ username, password, email }) {
    return this.httpClient
      .post(
        '/api/v1/users',
        { username, password, email },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  requestPasswordReset({ email }) {
    return this.httpClient
      .post(
        '/api/v1/users/request-password-reset',
        { email },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  completePasswordReset({ passwordResetRequestId, password }) {
    return this.httpClient
      .post(
        '/api/v1/users/complete-password-reset',
        { passwordResetRequestId, password },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  login({ username, password }) {
    return this.httpClient
      .post(
        '/api/v1/users/login',
        { username, password },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserRoles({ userId, roles }) {
    return this.httpClient
      .post(
        `/api/v1/users/${userId}/roles`,
        { roles },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserAccount({ username, email }) {
    return this.httpClient
      .post(
        '/api/v1/users/account',
        { username, email },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserProfile({ profile }) {
    return this.httpClient
      .post(
        '/api/v1/users/profile',
        { profile },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserLockedOutState({ userId, lockedOut }) {
    return this.httpClient
      .post(
        `/api/v1/users/${userId}/lockedOut`,
        { lockedOut },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default UserApiClient;
