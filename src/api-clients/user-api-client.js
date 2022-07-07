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

  login({ emailOrUsername, password }) {
    return this.httpClient
      .post(
        '/api/v1/users/login',
        { emailOrUsername, password },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserRoles({ userId, roles }) {
    return this.httpClient
      .post(
        `/api/v1/users/${encodeURIComponent(userId)}/roles`,
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
        `/api/v1/users/${encodeURIComponent(userId)}/lockedOut`,
        { lockedOut },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserStoragePlan({ userId, storagePlanId }) {
    return this.httpClient
      .post(
        `/api/v1/users/${encodeURIComponent(userId)}/storagePlan`,
        { storagePlanId },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  addUserStorageReminder({ userId }) {
    return this.httpClient
      .post(
        `/api/v1/users/${encodeURIComponent(userId)}/storageReminders`,
        null,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteAllUserStorageReminders({ userId }) {
    return this.httpClient
      .delete(
        `/api/v1/users/${encodeURIComponent(userId)}/storageReminders`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getFavorites() {
    return this.httpClient
      .get(
        '/api/v1/users/favorites',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  addFavorite({ type, id }) {
    return this.httpClient
      .post(
        '/api/v1/users/favorites',
        { type, id },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  removeFavorite({ type, id }) {
    return this.httpClient
      .delete(
        '/api/v1/users/favorites',
        { data: { type, id } },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  closeUserAccount({ userId }) {
    return this.httpClient
      .delete(
        `/api/v1/users/${encodeURIComponent(userId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default UserApiClient;
