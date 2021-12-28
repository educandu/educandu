import { add } from 'date-fns';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import UserService from './user-service.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

const PENDING_ROOM_INVITATION_EXPIRATION_TIMESPAN = { days: 7 };

const roomInvitationProjection = {
  _id: 1,
  email: 1,
  sentOn: 1,
  expires: 1
};

export default class RoomService {
  static get inject() { return [RoomStore, RoomInvitationStore, UserService, TransactionRunner]; }

  constructor(roomStore, roomInvitationStore, userService, transactionRunner) {
    this.roomStore = roomStore;
    this.roomInvitationStore = roomInvitationStore;
    this.userService = userService;
    this.transactionRunner = transactionRunner;
  }

  getRoomById(roomId) {
    return this.roomStore.findOne({ _id: roomId });
  }

  async _getRooms({ ownerId, memberId }) {
    const orFilters = [];

    if (ownerId) {
      orFilters.push({ owner: ownerId });
    }
    if (memberId) {
      orFilters.push({ members: { $elemMatch: { userId: memberId } } });
    }

    const filter = orFilters.length === 1 ? orFilters[0] : { $or: orFilters };

    const rooms = await this.roomStore.find(filter);
    return rooms;
  }

  async getRoomsOwnedOrJoinedByUser(userId) {
    const rooms = await this._getRooms({ ownerId: userId, memberId: userId });
    return rooms;
  }

  async createRoom({ name, access, user }) {
    const newRoom = {
      _id: uniqueId.create(),
      name,
      access,
      owner: user._id,
      createdBy: user._id,
      createdOn: new Date(),
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

    let invitation = await this.roomInvitationStore.findOne({ roomId, email: lowerCasedEmail });
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

  async verifyInvitationToken({ token, user }) {
    let roomId = null;
    let roomName = null;
    let isValid = false;

    const invitation = await this.roomInvitationStore.findOne({ token });
    if (invitation?.email === user.email) {
      const room = await this.roomStore.findOne({ _id: invitation.roomId });
      if (room) {
        roomId = room._id;
        roomName = room.name;
        isValid = true;
      }
    }

    return { roomId, roomName, isValid };
  }

  async confirmInvitation({ token, user }) {
    const invitation = await this.roomInvitationStore.findOne({ token });
    if (invitation?.email !== user.email) {
      throw new NotFound();
    }

    await this.transactionRunner.run(async session => {
      const newMember = {
        userId: user._id,
        joinedOn: new Date()
      };

      await this.roomStore.updateOne(
        { _id: invitation.roomId },
        { $push: { members: newMember } },
        { session }
      );

      await this.roomInvitationStore.deleteOne({ _id: invitation._id }, { session });
    });
  }

  async isRoomMemberOrOwner(roomId, userId) {
    const room = await this.roomStore.findOne({ $and: [{ _id: roomId }, { $or: [{ 'members.userId': userId }, { owner: userId }] }] });
    return !!room;
  }

  getRoomInvitations(roomId) {
    return this.roomInvitationStore.find({ roomId }, { projection: roomInvitationProjection });
  }
}
