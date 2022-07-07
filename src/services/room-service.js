import moment from 'moment';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import Cdn from '../repositories/cdn.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import UserStore from '../stores/user-store.js';
import LessonStore from '../stores/lesson-store.js';
import { ensureIsExcluded } from '../utils/array-utils.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { getPathForPrivateRoom } from '../utils/storage-utils.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import {
  INVALID_ROOM_INVITATION_REASON,
  PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS,
  ROOM_ACCESS_LEVEL,
  STORAGE_DIRECTORY_MARKER_NAME
} from '../domain/constants.js';

const { BadRequest, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

export default class RoomService {
  static get inject() {
    return [Cdn, RoomStore, RoomInvitationStore, LessonStore, LockStore, UserStore, TransactionRunner];
  }

  constructor(cdn, roomStore, roomInvitationStore, lessonStore, lockStore, userStore, transactionRunner) {
    this.cdn = cdn;
    this.roomStore = roomStore;
    this.lockStore = lockStore;
    this.userStore = userStore;
    this.lessonStore = lessonStore;
    this.transactionRunner = transactionRunner;
    this.roomInvitationStore = roomInvitationStore;
  }

  getRoomById(roomId) {
    return this.roomStore.getRoomById(roomId);
  }

  getRoomInvitationById(roomInvitationId) {
    return this.roomInvitationStore.getRoomInvitationById(roomInvitationId);
  }

  getRoomsOwnedByUser(userId) {
    return this.roomStore.getRoomsByOwnerId(userId);
  }

  getPrivateRoomsOwnedByUser(userId) {
    return this.roomStore.getPrivateRoomsByOwnerId(userId);
  }

  getRoomsOwnedOrJoinedByUser(userId) {
    return this.roomStore.getRoomsOwnedOrJoinedByUser(userId);
  }

  getRoomInvitationsByEmail(email) {
    return this.roomInvitationStore.getRoomInvitationsByEmail(email);
  }

  async isRoomOwnerOrMember(roomId, userId) {
    const room = await this.roomStore.getRoomsByIdOwnedOrJoinedByUser({ roomId, userId });
    return !!room;
  }

  async createRoom({ name, slug, access, lessonsMode, user }) {
    const roomId = uniqueId.create();

    if (access === ROOM_ACCESS_LEVEL.private) {
      await this.createUploadDirectoryMarkerForRoom(roomId);
    }

    const newRoom = {
      _id: roomId,
      name,
      slug: slug?.trim() || '',
      access,
      lessonsMode,
      description: '',
      owner: user._id,
      createdBy: user._id,
      createdOn: new Date(),
      updatedOn: new Date(),
      members: []
    };

    try {
      await this.roomStore.saveRoom(newRoom);
    } catch (error) {
      if (access === ROOM_ACCESS_LEVEL.private) {
        await this.deleteUploadDirectoryMarkerForRoom(roomId);
      }
      throw error;
    }

    return newRoom;
  }

  async createUploadDirectoryMarkerForRoom(roomId) {
    const homePath = getPathForPrivateRoom(roomId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.uploadEmptyObject(directoryMarkerPath);
  }

  async deleteUploadDirectoryMarkerForRoom(roomId) {
    const homePath = getPathForPrivateRoom(roomId);
    const directoryMarkerPath = urlUtils.concatParts(homePath, STORAGE_DIRECTORY_MARKER_NAME);
    await this.cdn.deleteObject(directoryMarkerPath);
  }

  async updateRoom(room) {
    const updatedRoom = {
      ...room,
      slug: room.slug || '',
      description: room.description || '',
      updatedOn: new Date()
    };
    await this.roomStore.saveRoom(updatedRoom);
    return updatedRoom;
  }

  getRoomInvitations(roomId) {
    return this.roomInvitationStore.getRoomInvitationMetadataByRoomId(roomId);
  }

  async createOrUpdateInvitation({ roomId, email, user }) {
    const now = new Date();
    const lowerCasedEmail = email.toLowerCase();

    const room = await this.roomStore.getRoomByIdAndOwnerId({ roomId, ownerId: user._id });
    if (!room) {
      throw new NotFound(`A room with ID '${roomId}' owned by '${user._id}' could not be found`);
    }

    const owner = await this.userStore.getUserById(room.owner);

    if (owner.email.toLowerCase() === lowerCasedEmail) {
      throw new BadRequest('Invited user is the same as room owner');
    }

    let invitation = await this.roomInvitationStore.getRoomInvitationByRoomIdAndEmail({ roomId, email: lowerCasedEmail });
    if (!invitation) {
      invitation = {
        _id: uniqueId.create(),
        roomId,
        email: lowerCasedEmail
      };
    }

    invitation.sentOn = now;
    invitation.token = uniqueId.create();
    invitation.expires = moment(now).add(PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS, 'days').toDate();

    logger.info(`Creating or updating room invitation with ID ${invitation._id}`);
    await this.roomInvitationStore.saveRoomInvitation(invitation);

    return { room, owner, invitation };
  }

  async verifyInvitationToken({ token, user }) {
    const response = {
      roomId: null,
      roomName: null,
      roomSlug: null,
      invalidInvitationReason: null
    };

    const invitation = await this.roomInvitationStore.getRoomInvitationByToken(token);
    if (!invitation) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.token;
      return response;
    }

    if (invitation.email !== user.email) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.user;
      logger.debug(`Invitation ${invitation._id} was sent to email '${invitation?.email}' but accessed by user with email '${user.email}'`);
      return response;
    }

    const room = await this.roomStore.getRoomById(invitation.roomId);
    if (!room) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.room;
      return response;
    }

    response.roomId = room._id;
    response.roomName = room.name;
    response.roomSlug = room.slug;
    return response;
  }

  async confirmInvitation({ token, user }) {
    const invitation = await this.roomInvitationStore.getRoomInvitationByToken(token);
    if (invitation?.email !== user.email) {
      throw new NotFound();
    }

    await this.transactionRunner.run(async session => {
      const newMember = {
        userId: user._id,
        joinedOn: new Date()
      };

      let lock;

      try {
        lock = await this.lockStore.takeRoomLock(invitation.roomId);

        const roomContainingNewMember = await this.roomStore.getRoomByIdJoinedByUser(
          { roomId: invitation.roomId, userId: newMember.userId },
          { session }
        );

        if (!roomContainingNewMember) {
          await this.roomStore.appendRoomMember({ roomId: invitation.roomId, member: newMember }, { session });
        }

        await this.roomInvitationStore.deleteRoomInvitationById(invitation._id, { session });
      } finally {
        this.lockStore.releaseLock(lock);
      }
    });
  }

  async removeRoomMember({ room, memberUserId }) {
    const member = room.members.find(m => m.userId === memberUserId);
    const remainingMembers = ensureIsExcluded(room.members, member);
    const updatedRoom = await this.updateRoom({ ...room, members: remainingMembers });

    return updatedRoom;
  }

  async removeMembershipFromAllRoomsForUser(memberUserId) {
    await this.roomStore.deleteRoomsMemberById(memberUserId);
  }

  async deleteRoomInvitation({ room, invitation }) {
    await this.roomInvitationStore.deleteRoomInvitationById(invitation._id);
    const remainingRoomInvitations = await this.getRoomInvitations(room._id);

    return remainingRoomInvitations;
  }
}
