import moment from 'moment';
import Cdn from '../stores/cdn.js';
import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import UserStore from '../stores/user-store.js';
import EventStore from '../stores/event-store.js';
import DocumentStore from '../stores/document-store.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { ensureIsExcluded, getSymmetricalDifference } from '../utils/array-utils.js';
import { createUniqueStorageFileName, getRoomMediaRoomPath } from '../utils/storage-utils.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
import { INVALID_ROOM_INVITATION_REASON, PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS } from '../domain/constants.js';

const { BadRequest, Forbidden, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

export default class RoomService {
  static dependencies = [
    Cdn,
    RoomStore,
    RoomInvitationStore,
    DocumentRevisionStore,
    DocumentCommentStore,
    DocumentStore,
    UserStore,
    StoragePlanStore,
    EventStore,
    LockStore,
    TransactionRunner
  ];

  constructor(
    cdn,
    roomStore,
    roomInvitationStore,
    documentRevisionStore,
    documentCommentStore,
    documentStore,
    userStore,
    storagePlanStore,
    eventStore,
    lockStore,
    transactionRunner
  ) {
    this.cdn = cdn;
    this.roomStore = roomStore;
    this.lockStore = lockStore;
    this.userStore = userStore;
    this.eventStore = eventStore;
    this.documentStore = documentStore;
    this.storagePlanStore = storagePlanStore;
    this.transactionRunner = transactionRunner;
    this.roomInvitationStore = roomInvitationStore;
    this.documentCommentStore = documentCommentStore;
    this.documentRevisionStore = documentRevisionStore;
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

  getRoomsOwnedOrJoinedByUser(userId) {
    return this.roomStore.getRoomsOwnedOrJoinedByUser(userId);
  }

  getRoomsByOwnerOrCollaboratorUser(userId) {
    return this.roomStore.getRoomsByOwnerOrCollaboratorUser({ userId });
  }

  async createRoom({ name, slug, isCollaborative, user }) {
    const roomId = uniqueId.create();
    const roomMediaDirectoryPath = getRoomMediaRoomPath(roomId);

    await this.cdn.ensureDirectory({ directoryPath: roomMediaDirectoryPath });

    const newRoom = {
      _id: roomId,
      name,
      slug: slug?.trim() || '',
      isCollaborative,
      description: '',
      owner: user._id,
      createdBy: user._id,
      createdOn: new Date(),
      updatedOn: new Date(),
      members: [],
      messages: [],
      documents: []
    };

    try {
      await this.roomStore.saveRoom(newRoom);
    } catch (error) {
      await this.cdn.deleteDirectory({ directoryPath: roomMediaDirectoryPath });
      throw error;
    }

    return newRoom;
  }

  async updateRoomMetadata(roomId, { name, slug, isCollaborative, description }) {
    await this.roomStore.updateRoomMetadata(
      roomId,
      {
        name: name.trim(),
        slug: (slug || '').trim(),
        isCollaborative,
        description: (description || '').trim(),
        updatedOn: new Date()
      }
    );
    const updatedRoom = await this.roomStore.getRoomById(roomId);

    return updatedRoom;
  }

  async updateRoomDocumentsOrder(roomId, documentIds) {
    let lock;

    try {
      lock = await this.lockStore.takeRoomLock(roomId);
      const room = await this.roomStore.getRoomById(roomId);
      const allDocumentIdsCorrectlyProvided = getSymmetricalDifference(documentIds, room.documents).length === 0;

      if (!allDocumentIdsCorrectlyProvided) {
        throw new BadRequest('Incorrect list of document ids was provided.');
      }

      await this.roomStore.updateRoomDocuments(roomId, documentIds);
    } finally {
      await this.lockStore.releaseLock(lock);
    }

    const updatedRoom = await this.roomStore.getRoomById(roomId);
    return updatedRoom;
  }

  async deleteRoom({ room, roomOwner }) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(roomOwner._id);
      logger.info(`Deleting room with ID ${room._id}`);

      await this.transactionRunner.run(async session => {
        const documents = await this.documentStore.getDocumentsMetadataByRoomId(room._id, { session });
        const documentIds = documents.map(doc => doc._id);

        await this.documentCommentStore.deleteDocumentCommentsByDocumentIds(documentIds, { session });
        await this.documentRevisionStore.deleteDocumentsByRoomId(room._id, { session });
        await this.documentStore.deleteDocumentsByRoomId(room._id, { session });
        await this.roomInvitationStore.deleteRoomInvitationsByRoomId(room._id, { session });
        await this.roomStore.deleteRoomById(room._id, { session });
      });

      await this.cdn.deleteDirectory({ directoryPath: getRoomMediaRoomPath(room._id) });

      const { usedBytes } = await this.getRoomMediaOverview({ user: roomOwner });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes });

      Object.assign(roomOwner, updatedUser);
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async getRoomMediaOverview({ user }) {
    const storagePlan = user.storage.planId
      ? await this.storagePlanStore.getStoragePlanById(user.storage.planId)
      : null;

    const rooms = await this.roomStore.getRoomsByOwnerId(user._id);
    const objectsPerRoom = await Promise.all(rooms.map(async room => {
      const objects = await this.cdn.listObjects({ directoryPath: getRoomMediaRoomPath(room._id) });
      return { room, objects, usedBytes: objects.reduce((accu, obj) => accu + obj.size, 0) };
    }));

    const usedBytesInAllRooms = objectsPerRoom.reduce((accu, { usedBytes }) => accu + usedBytes, 0);

    return {
      storagePlan: storagePlan || null,
      usedBytes: usedBytesInAllRooms,
      roomStorageList: objectsPerRoom.map(({ room, objects }) => ({
        roomId: room._id,
        roomName: room.name,
        objects
      }))
    };
  }

  async getAllRoomMedia({ user, roomId }) {
    const room = await this.roomStore.getRoomById(roomId);
    if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to access media for room '${roomId}'`);
    }

    const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.findActiveUserById(room.owner);
    const overview = await this.getRoomMediaOverview({ user: roomOwner });

    return {
      storagePlan: overview.storagePlan,
      usedBytes: overview.usedBytes,
      roomStorage: overview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
    };
  }

  async createRoomMedia({ user, roomId, file }) {
    let lock;
    try {
      const room = await this.roomStore.getRoomById(roomId);
      if (!isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to create media for room '${roomId}'`);
      }

      lock = await this.lockStore.takeUserLock(room.owner);

      const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.findActiveUserById(room.owner);
      if (!roomOwner.storage.planId) {
        throw new BadRequest('Cannot upload to room-media storage without a storage plan');
      }

      const storagePlan = await this.storagePlanStore.getStoragePlanById(roomOwner.storage.planId);
      const availableBytes = storagePlan.maxBytes - roomOwner.storage.usedBytes;
      if (availableBytes < file.size) {
        throw new BadRequest(`Not enough storage space: available ${prettyBytes(availableBytes)}, required ${prettyBytes(file.size)}`);
      }

      const parentPath = getRoomMediaRoomPath(roomId);
      const uniqueFileName = createUniqueStorageFileName(file.originalname);
      const cdnObjectPath = urlUtils.concatParts(parentPath, uniqueFileName);
      await this.cdn.uploadObject(cdnObjectPath, file.path);

      const overview = await this.getRoomMediaOverview({ user: roomOwner });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes: overview.usedBytes });

      Object.assign(roomOwner, updatedUser);

      return {
        storagePlan: overview.storagePlan,
        usedBytes: overview.usedBytes,
        roomStorage: overview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId),
        createdObjectPath: cdnObjectPath
      };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async deleteRoomMedia({ user, roomId, name }) {
    let lock;
    try {
      lock = await this.lockStore.takeUserLock(user._id);

      const room = await this.roomStore.getRoomById(roomId);
      if (!isRoomOwner({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to delete media for room '${roomId}'`);
      }

      const objects = await this.cdn.listObjects({ directoryPath: getRoomMediaRoomPath(roomId) });

      const itemToDelete = objects.find(obj => obj.name === name);
      if (!itemToDelete) {
        throw new NotFound(`Object '${name}' could not be found`);
      }

      await this.cdn.deleteObject(itemToDelete.path);

      const overview = await this.getRoomMediaOverview({ user });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: user._id, usedBytes: overview.usedBytes });

      Object.assign(user, updatedUser);

      return {
        storagePlan: overview.storagePlan,
        usedBytes: overview.usedBytes,
        roomStorage: overview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
      };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  getRoomInvitationsByEmail(email) {
    return this.roomInvitationStore.getRoomInvitationsByEmail(email);
  }

  getRoomInvitations(roomId) {
    return this.roomInvitationStore.getRoomInvitationMetadataByRoomId(roomId);
  }

  async createOrUpdateInvitations({ roomId, emails, user }) {
    const now = new Date();
    const lowerCasedEmails = [...new Set(emails.map(email => email.toLowerCase()))];

    const room = await this.roomStore.getRoomByIdAndOwnerId({ roomId, ownerId: user._id });
    if (!room) {
      throw new NotFound(`A room with ID '${roomId}' owned by '${user._id}' could not be found`);
    }

    const owner = await this.userStore.getUserById(room.owner);
    const lowerCasedOwnerEmail = owner.email.toLowerCase();
    if (lowerCasedEmails.some(email => email === lowerCasedOwnerEmail)) {
      throw new BadRequest('Invited user is the same as room owner');
    }

    const invitations = await Promise.all(lowerCasedEmails.map(async email => {
      let invitation = await this.roomInvitationStore.getRoomInvitationByRoomIdAndEmail({ roomId, email });
      if (!invitation) {
        invitation = {
          _id: uniqueId.create(),
          token: uniqueId.create(),
          roomId,
          email
        };
      }

      invitation.sentOn = now;
      invitation.expiresOn = moment(now).add(PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS, 'days').toDate();

      logger.info(`Creating or updating room invitation with ID ${invitation._id}`);
      await this.roomInvitationStore.saveRoomInvitation(invitation);
      return invitation;
    }));

    return { room, owner, invitations };
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
        await this.lockStore.releaseLock(lock);
      }
    });
  }

  async deleteRoomInvitation({ room, invitation }) {
    await this.roomInvitationStore.deleteRoomInvitationById(invitation._id);
    const remainingRoomInvitations = await this.getRoomInvitations(room._id);

    return remainingRoomInvitations;
  }

  async createRoomMessage({ room, text, emailNotification }) {
    const messages = cloneDeep(room.messages);
    const newMessage = {
      key: uniqueId.create(),
      text,
      emailNotification,
      createdOn: new Date()
    };

    messages.push(newMessage);

    await this.transactionRunner.run(async session => {
      await this.roomStore.updateRoomMessages(room._id, messages, { session });
      await this.eventStore.recordRoomMessageCreatedEvent({ userId: room.owner, roomId: room._id, roomMessageKey: newMessage.key }, { session });
    });

    const updatedRoom = await this.roomStore.getRoomById(room._id);

    return updatedRoom;
  }

  async deleteRoomMessage({ room, messageKey }) {
    const message = room.messages.find(m => m.key === messageKey);
    const remainingMessages = ensureIsExcluded(room.messages, message);

    await this.roomStore.updateRoomMessages(room._id, remainingMessages);

    const updatedRoom = await this.roomStore.getRoomById(room._id);

    return updatedRoom;
  }

  async removeRoomMember({ room, memberUserId }) {
    const member = room.members.find(m => m.userId === memberUserId);
    const remainingMembers = ensureIsExcluded(room.members, member);
    await this.roomStore.updateRoomMembers(room._id, remainingMembers);

    const updatedRoom = await this.roomStore.getRoomById(room._id);

    return updatedRoom;
  }

  async removeMembershipFromAllRoomsForUser(memberUserId) {
    await this.roomStore.deleteRoomsMemberById(memberUserId);
  }
}
