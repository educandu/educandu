import { add } from 'date-fns';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import { ROOM_ACCESS_LEVEL } from '../common/constants.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

const PENDING_ROOM_INVITATION_EXPIRATION_TIMESPAN = { days: 7 };

export default class RoomService {
  static get inject() { return [RoomStore, RoomInvitationStore, UserService]; }

  constructor(roomStore, roomInvitationStore, userService) {
    this.roomStore = roomStore;
    this.roomInvitationStore = roomInvitationStore;
    this.userService = userService;
  }

  async createRoom({ name, access, user }) {
    const newRoom = {
      _id: uniqueId.create(),
      name,
      access,
      owner: user._id,
      members: []
    };

    await this.roomStore.save(newRoom);
    return newRoom;
  }

  async findOwnedRoomById({ roomId, ownerId }) {
    const room = await this.roomStore.findOne({ _id: roomId });
    if (room?.owner !== ownerId) {
      throw new NotFound(`A room with ID '${roomId}' owned by '${ownerId}' could not be found`);
    }

    return room;
  }

  async createOrUpdateInvitation({ roomId, email, user }) {
    const now = new Date();
    const lowerCasedEmail = email.toLowerCase();

    const room = await this.findOwnedRoomById({ roomId, ownerId: user._id });
    if (room.access === ROOM_ACCESS_LEVEL.public) {
      throw new BadRequest(`Room with ID '${roomId}' is public, therefore invitations cannot be sent`);
    }

    const owner = await this.userService.getUserById(room.owner);

    let invitation = await this.roomInvitationStore.find({ roomId, email: lowerCasedEmail });
    if (!invitation) {
      invitation = {
        _id: uniqueId.create(),
        roomId,
        email: lowerCasedEmail
      };
    }

    invitation.sentOn = now;
    invitation.token = uniqueId.create();
    invitation.expires = add(now, PENDING_ROOM_INVITATION_EXPIRATION_TIMESPAN);

    logger.info(`Creating or updating room invitation with ID ${invitation._id}`);
    await this.roomInvitationStore.save(invitation);

    return { room, owner, invitation };
  }

  getRoomById(roomId) {
    return this.roomStore.findOne({ _id: roomId });
  }
}
