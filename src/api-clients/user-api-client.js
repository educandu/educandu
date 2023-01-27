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

  getExternalAccounts() {
    return this.httpClient
      .get(
        '/api/v1/users/external-accounts',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteExternalAccount({ externalAccountId }) {
    return this.httpClient
      .delete(
        `/api/v1/users/external-accounts/${encodeURIComponent(externalAccountId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  requestRegistration({ email, password, displayName }) {
    return this.httpClient
      .post(
        '/api/v1/users/request-registration',
        { email, password, displayName },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  completeRegistration({ userId, verificationCode }) {
    return this.httpClient
      .post(
        '/api/v1/users/complete-registration',
        { userId, verificationCode },
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

  login({ email, password, connectExternalAccount = false }) {
    return this.httpClient
      .post(
        '/api/v1/users/login',
        { email, password, connectExternalAccount },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  abortExternalAccountConnection() {
    return this.httpClient
      .delete(
        '/api/v1/users/abort-external-account-connection',
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

  saveUserAccount({ email }) {
    return this.httpClient
      .post(
        '/api/v1/users/account',
        { email },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserProfile({ displayName, organization, introduction }) {
    return this.httpClient
      .post(
        '/api/v1/users/profile',
        { displayName, organization, introduction },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  saveUserAccountLockedOnState({ userId, accountLockedOn }) {
    return this.httpClient
      .post(
        `/api/v1/users/${encodeURIComponent(userId)}/accountLockedOn`,
        { accountLockedOn },
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

  getActivities() {
    return this.httpClient
      .get(
        '/api/v1/users/activities',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getRoomsInvitations() {
    return this.httpClient
      .get(
        '/api/v1/users/rooms-invitations',
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
