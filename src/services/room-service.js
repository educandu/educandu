import RoomStore from '../stores/room-store.js';
import uniqueId from '../utils/unique-id.js';

export default class RoomService {
  static get inject() { return [RoomStore]; }

  constructor(roomsStore) {
    this.roomsStore = roomsStore;
  }

  async createRoom(room) {
    const newRoom = {
      _id: uniqueId.create(),
      ...room,
      members: []
    };

    await this.roomsStore.save(newRoom);
    return newRoom;
  }
}
