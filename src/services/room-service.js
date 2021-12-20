import RoomsStore from '../stores/rooms-store.js';

export default class RoomService {
  static get inject() { return [RoomsStore]; }

  constructor(roomsStore) {
    this.roomsStore = roomsStore;
  }

  createRoom(room) {
    const newRoom = {
      ...room,
      members: []
    };

    return this.roomsStore.save(newRoom);
  }
}
