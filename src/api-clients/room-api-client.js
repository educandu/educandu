import HttpClient from './http-client.js';

class RoomApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addRoom({ name, access }) {
    return this.httpClient
      .post(
        '/api/v1/rooms',
        { name, access },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  addRoomInvitation({ email, roomId }) {
    return this.httpClient
      .post(
        '/api/v1/room-invitations',
        { email, roomId },
        { responseType: 'json' }
      )
      .then(res => res.data);
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

  deleteRoom(roomId) {
    return this.httpClient
      .delete(
        `/api/v1/rooms/${roomId}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default RoomApiClient;
