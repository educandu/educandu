import HttpClient from './http-client.js';

class RoomApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  confirmInvitation({ token }) {
    return this.httpClient
      .post(
        '/api/v1/room-invitations/confirm',
        { token },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default RoomApiClient;

