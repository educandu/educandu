import HttpClient from './http-client.js';
import urlUtils from '../utils/url-utils.js';

class RoomApiClient {
  static dependencies = [HttpClient];

  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  getRoom({ roomId }) {
    return this.httpClient
      .get(
        `/api/v1/rooms/${encodeURIComponent(roomId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getRooms({ userRole }) {
    return this.httpClient
      .get(
        `/api/v1/rooms?${urlUtils.composeQueryString({ userRole })}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  addRoom({ name, slug, isCollaborative }) {
    return this.httpClient
      .post(
        '/api/v1/rooms',
        { name, slug, isCollaborative },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateRoomMetadata({ roomId, name, slug, isCollaborative, description }) {
    return this.httpClient
      .patch(
        `/api/v1/rooms/${encodeURIComponent(roomId)}/metadata`,
        { name, slug, isCollaborative, description },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  updateRoomDocumentsOrder({ roomId, documentIds }) {
    return this.httpClient
      .patch(
        `/api/v1/rooms/${encodeURIComponent(roomId)}/documents`,
        { documentIds },
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

  addRoomMessage({ roomId, text, emailNotification }) {
    return this.httpClient
      .post(
        `/api/v1/rooms/${encodeURIComponent(roomId)}/messages`,
        { text, emailNotification },
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRoomMessage({ roomId, messageKey }) {
    return this.httpClient
      .delete(
        `/api/v1/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageKey)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteRoom({ roomId }) {
    return this.httpClient
      .delete(
        `/api/v1/rooms/${encodeURIComponent(roomId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  deleteAllRoomsForUser({ ownerId }) {
    return this.httpClient
      .delete(
        `/api/v1/rooms?ownerId=${encodeURIComponent(ownerId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getRoomMediaOverview() {
    return this.httpClient
      .get(
        '/api/v1/room-media-overview',
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  getAllRoomMedia({ roomId }) {
    return this.httpClient
      .get(
        `/api/v1/room-media/${encodeURIComponent(roomId)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  postRoomMedia({ roomId, file }) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.httpClient
      .post(
        `/api/v1/room-media/${encodeURIComponent(roomId)}`,
        formData,
        { responseType: 'json', headers: { 'content-type': 'multipart/form-data' } }
      )
      .then(res => res.data);
  }

  deleteRoomMedia({ roomId, name }) {
    return this.httpClient
      .delete(
        `/api/v1/room-media/${encodeURIComponent(roomId)}/${encodeURIComponent(name)}`,
        { responseType: 'json' }
      )
      .then(res => res.data);
  }

  addRoomInvitations({ emails, roomId }) {
    return this.httpClient
      .post(
        '/api/v1/room-invitations',
        { emails, roomId },
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
