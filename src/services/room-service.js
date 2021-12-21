import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import UserService from '../services/user-service.js';

export default class RoomService {
  static get inject() { return [RoomStore, UserService]; }

  constructor(roomsStore, userService) {
    this.roomsStore = roomsStore;
    this.userService = userService;
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

  getRoomById(roomId) {
    return this.roomsStore.findOne({ _id: roomId });
  }
}
