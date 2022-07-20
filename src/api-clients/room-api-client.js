import HttpClient from './http-client.js';
import { ROOM_ACCESS } from '../domain/constants.js';

class RoomApiClient {
  static inject() { return [HttpClient]; }

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  addRoom({ name, slug, access, documentsMode }) {
    return this.httpClient
      .post(
        '/api/v1/rooms',
        { name, slug, access, documentsMode },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateRoom({ roomId, name, slug, documentsMode, description }) {
    return this.httpClient
      .patch(
        `/api/v1/rooms/${encodeURIComponent(roomId)}`,
        { name, slug, documentsMode, description },
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

  deleteAllPrivateRoomsForUser({ ownerId }) {
    return this.httpClient
      .delete(
        `/api/v1/rooms?ownerId=${encodeURIComponent(ownerId)}&access=${encodeURIComponent(ROOM_ACCESS.private)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRoom(roomId) {
    return this.httpClient
      .delete(
        `/api/v1/rooms/${encodeURIComponent(roomId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRoomMember({ roomId, memberUserId }) {
    return this.httpClient
      .delete(
        `/api/v1/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberUserId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRoomInvitation({ invitationId }) {
    return this.httpClient
      .delete(
        `/api/v1/room-invitations/${encodeURIComponent(invitationId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }
}

export default RoomApiClient;
