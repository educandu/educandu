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

  async getRoomDetailsById(roomId) {
    const roomDetails = await this.roomsStore.findOne({ _id: roomId });

    if (!roomDetails) {
      return null;
    }

    const owner = await this.userService.getUserById(roomDetails.owner);
    roomDetails.owner = {
      userId: owner._id,
      username: owner.username,
      email: owner.email
    };

    const members = await this.userService.getUsersByIds(roomDetails.members.map(member => member.userId));

    roomDetails.members = roomDetails.members.map(member => {
      const memberDetails = members.find(user => member.userId === user._id);
      return {
        ...member,
        email: memberDetails.email,
        username: memberDetails.username
      };
    });

    return roomDetails;
  }
}
