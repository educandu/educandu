import mime from 'mime';
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
import { getCdnPath } from '../utils/source-utils.js';
import DocumentStore from '../stores/document-store.js';
import { getResourceType } from '../utils/resource-utils.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import DocumentInputStore from '../stores/document-input-store.js';
import RoomMediaItemStore from '../stores/room-media-item-store.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentCommentStore from '../stores/document-comment-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';
import { consolidateCdnResourcesForSaving } from '../utils/cdn-resource-utils.js';
import { ensureIsExcluded, getSymmetricalDifference } from '../utils/array-utils.js';
import DocumentInputMediaItemStore from '../stores/document-input-media-item-store.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
import { createUniqueStorageFileName, getDocumentInputMediaPath, getPrivateStorageOverview, getRoomMediaRoomPath } from '../utils/storage-utils.js';
import {
  CDN_URL_PREFIX,
  DEFAULT_CONTENT_TYPE,
  INVALID_ROOM_INVITATION_REASON,
  PENDING_ROOM_INVITATION_EXPIRATION_IN_DAYS
} from '../domain/constants.js';

const { BadRequest, Forbidden, NotFound } = httpErrors;

const logger = new Logger(import.meta.url);

export default class RoomService {
  static dependencies = [
    Cdn,
    RoomStore,
    RoomInvitationStore,
    RoomMediaItemStore,
    DocumentRevisionStore,
    DocumentCommentStore,
    DocumentStore,
    DocumentInputStore,
    UserStore,
    StoragePlanStore,
    EventStore,
    LockStore,
    TransactionRunner,
    DocumentInputMediaItemStore,
    GithubFlavoredMarkdown
  ];

  constructor(
    cdn,
    roomStore,
    roomInvitationStore,
    roomMediaItemStore,
    documentRevisionStore,
    documentCommentStore,
    documentStore,
    documentInputStore,
    userStore,
    storagePlanStore,
    eventStore,
    lockStore,
    transactionRunner,
    documentInputMediaItemStore,
    githubFlavoredMarkdown
  ) {
    this.cdn = cdn;
    this.roomStore = roomStore;
    this.lockStore = lockStore;
    this.userStore = userStore;
    this.eventStore = eventStore;
    this.documentStore = documentStore;
    this.storagePlanStore = storagePlanStore;
    this.transactionRunner = transactionRunner;
    this.roomMediaItemStore = roomMediaItemStore;
    this.documentInputStore = documentInputStore;
    this.roomInvitationStore = roomInvitationStore;
    this.documentCommentStore = documentCommentStore;
    this.documentRevisionStore = documentRevisionStore;
    this.githubFlavoredMarkdown = githubFlavoredMarkdown;
    this.documentInputMediaItemStore = documentInputMediaItemStore;
  }

  getRoomById(roomId) {
    return this.roomStore.getRoomById(roomId);
  }

  getRoomInvitationById(roomInvitationId) {
    return this.roomInvitationStore.getRoomInvitationById(roomInvitationId);
  }

  getRoomsOwnedByUser(userId) {
    return this.roomStore.getRoomsByOwnerUserId(userId);
  }

  getRoomsOwnedOrJoinedByUser(userId) {
    return this.roomStore.getRoomsOwnedOrJoinedByUser(userId);
  }

  getRoomsByOwnerOrCollaboratorUser(userId) {
    return this.roomStore.getRoomsByOwnerOrCollaboratorUser({ userId });
  }

  async createRoom({ name, slug, isCollaborative, shortDescription, user }) {
    const roomId = uniqueId.create();
    const roomMediaDirectoryPath = getRoomMediaRoomPath(roomId);

    await this.cdn.ensureDirectory({ directoryPath: roomMediaDirectoryPath });

    const newRoom = {
      _id: roomId,
      name,
      slug: slug?.trim() || '',
      isCollaborative,
      shortDescription: shortDescription?.trim() || '',
      ownedBy: user._id,
      createdBy: user._id,
      createdOn: new Date(),
      updatedOn: new Date(),
      overview: '',
      members: [],
      messages: [],
      documents: [],
      cdnResources: []
    };

    try {
      await this.roomStore.saveRoom(newRoom);
    } catch (error) {
      await this.cdn.deleteDirectory({ directoryPath: roomMediaDirectoryPath });
      throw error;
    }

    return newRoom;
  }

  async updateRoomMetadata(roomId, { name, slug, isCollaborative, shortDescription }) {
    await this.roomStore.updateRoomMetadata(
      roomId,
      {
        name: name.trim(),
        slug: (slug || '').trim(),
        isCollaborative,
        shortDescription: (shortDescription || '').trim(),
        updatedOn: new Date()
      }
    );
    const updatedRoom = await this.roomStore.getRoomById(roomId);

    return updatedRoom;
  }

  async updateRoomContent(roomId, { overview }) {
    const trimmedOverview = (overview || '').trim();
    await this.roomStore.updateRoomContent(
      roomId,
      {
        overview: trimmedOverview,
        cdnResources: this._extractCdnResources({ overview: trimmedOverview }),
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

  async consolidateCdnResources(roomId) {
    let lock;

    try {
      lock = await this.lockStore.takeRoomLock(roomId);
      await this.transactionRunner.run(async session => {
        const room = await this.roomStore.getRoomById(roomId, { session });
        const consolidatedRoom = { ...room, cdnResources: this._extractCdnResources(room) };
        await this.roomStore.saveRoom(consolidatedRoom, { session });
      });
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
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
        await this.documentInputStore.deleteDocumentInputsByDocumentIds(documentIds, { session });
        await this.roomInvitationStore.deleteRoomInvitationsByRoomId(room._id, { session });
        await this.roomStore.deleteRoomById(room._id, { session });
        await this.roomMediaItemStore.deleteRoomMediaItemsByRoomId(room._id, { session });
        await this.documentInputMediaItemStore.deleteDocumentInputMediaItemsByRoomId(room._id, { session });
      });

      await this.cdn.deleteDirectory({ directoryPath: getRoomMediaRoomPath(room._id) });
      await this.cdn.deleteDirectory({ directoryPath: getDocumentInputMediaPath({ roomId: room._id }) });

      const { usedBytes } = await this.getAllRoomMediaOverview({ user: roomOwner });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes });

      Object.assign(roomOwner, updatedUser);
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  getAllRoomMediaOverview({ user }) {
    return getPrivateStorageOverview({
      user,
      roomStore: this.roomStore,
      storagePlanStore: this.storagePlanStore,
      roomMediaItemStore: this.roomMediaItemStore,
      documentInputMediaItemStore: this.documentInputMediaItemStore
    });
  }

  async getSingleRoomMediaOverview({ user, roomId }) {
    const room = await this.roomStore.getRoomById(roomId);
    if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
      throw new Forbidden(`User is not authorized to access media for room '${roomId}'`);
    }

    const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.findActiveUserById(room.ownedBy);
    const allRoomMediaOverview = await this.getAllRoomMediaOverview({ user: roomOwner });

    return {
      storagePlan: allRoomMediaOverview.storagePlan,
      usedBytes: allRoomMediaOverview.usedBytes,
      roomStorage: allRoomMediaOverview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
    };
  }

  createRoomMediaItem({ user, roomId, file, storageUrl }) {
    const now = new Date();
    const roomMediaItemId = uniqueId.create();

    const resourceType = getResourceType(storageUrl);
    const contentType = mime.getType(storageUrl) || DEFAULT_CONTENT_TYPE;
    const size = file.size;

    const newRoomMediaItem = {
      _id: roomMediaItemId,
      roomId,
      resourceType,
      contentType,
      size,
      createdBy: user._id,
      createdOn: now,
      url: storageUrl,
      name: urlUtils.getFileName(storageUrl)
    };

    return newRoomMediaItem;
  }

  async createRoomMedia({ user, roomId, file }) {
    let lock;
    try {
      const room = await this.roomStore.getRoomById(roomId);
      if (!isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to create media for room '${roomId}'`);
      }

      lock = await this.lockStore.takeUserLock(room.ownedBy);

      const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.findActiveUserById(room.ownedBy);
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
      const storageUrl = `${CDN_URL_PREFIX}${cdnObjectPath}`;
      const roomMediaItem = this.createRoomMediaItem({ user, roomId, file, storageUrl });

      try {
        await this.cdn.moveObject(file.key, cdnObjectPath);
        await this.roomMediaItemStore.insertRoomMediaItem(roomMediaItem);
      } catch (error) {
        await this.cdn.deleteObject(cdnObjectPath);
        throw error;
      }

      const singleRoomMediaOverview = await this.getSingleRoomMediaOverview({ user: roomOwner, roomId });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes: singleRoomMediaOverview.usedBytes });

      Object.assign(roomOwner, updatedUser);

      return {
        ...singleRoomMediaOverview,
        createdRoomMediaItemId: roomMediaItem._id
      };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async deleteRoomMedia({ user, roomId, roomMediaItemId }) {
    let lock;
    try {
      lock = await this.lockStore.takeUserLock(user._id);

      const room = await this.roomStore.getRoomById(roomId);
      if (!isRoomOwner({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to delete media for room '${roomId}'`);
      }

      const roomMediaItemToDelete = await this.roomMediaItemStore.getRoomMediaItemById(roomMediaItemId);
      if (!roomMediaItemToDelete) {
        throw new NotFound(`Room media item '${roomMediaItemId}' could not be found`);
      }

      await this.cdn.deleteObject(getCdnPath({ url: roomMediaItemToDelete.url }));
      await this.roomMediaItemStore.deleteRoomMediaItem(roomMediaItemId);

      const singleRoomMediaOverview = await this.getSingleRoomMediaOverview({ user, roomId });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: user._id, usedBytes: singleRoomMediaOverview.usedBytes });

      Object.assign(user, updatedUser);

      return singleRoomMediaOverview;
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

  async createOrUpdateInvitations({ roomId, ownerUserId, emails }) {
    const now = new Date();
    const lowerCasedEmails = [...new Set(emails.map(email => email.toLowerCase()))];

    const room = await this.roomStore.getRoomByIdAndOwnerUserId({ roomId, ownerUserId });
    if (!room) {
      throw new NotFound(`A room with ID '${roomId}' owned by '${ownerUserId}' could not be found`);
    }

    const ownerUser = await this.userStore.getUserById(room.ownedBy);
    const lowerCasedOwnerEmail = ownerUser.email.toLowerCase();
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

    return { room, ownerUser, invitations };
  }

  async verifyInvitationToken({ token, user }) {
    const response = {
      roomId: null,
      roomName: null,
      roomSlug: null,
      invalidInvitationReason: null
    };

    if (user.expiresOn) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.unconfirmedUser;
      logger.debug(`Registration of user account with email '${user.email}' has not been confirmed.`);
      return response;
    }

    const invitation = await this.roomInvitationStore.getRoomInvitationByToken(token);
    if (!invitation) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.token;
      return response;
    }

    if (invitation.email !== user.email) {
      response.invalidInvitationReason = INVALID_ROOM_INVITATION_REASON.differenUser;
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
      await this.eventStore.recordRoomMessageCreatedEvent({ userId: room.ownedBy, roomId: room._id, roomMessageKey: newMessage.key }, { session });
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

    const userDocumentInputs = await this.documentInputStore.getAllDocumentInputsCreatedByUser(memberUserId);
    const documentInputsToDelete = userDocumentInputs.filter(documentInput => room.documents.includes(documentInput.documentId));
    const documentInputIdsToDelete = documentInputsToDelete.map(documentInput => documentInput._id);

    await this.roomStore.updateRoomMembers(room._id, remainingMembers);
    await this.documentInputStore.deleteDocumentInputsByIds(documentInputIdsToDelete);
    await this.documentInputMediaItemStore.deleteDocumentInputMediaItemsByDocumentInputIds(documentInputIdsToDelete);

    for (const documentInputId of documentInputsToDelete) {
      await this.cdn.deleteDirectory({ directoryPath: getDocumentInputMediaPath({ roomId: room._id, documentInputId }) });
    }

    const updatedRoom = await this.roomStore.getRoomById(room._id);

    return updatedRoom;
  }

  async removeMembershipFromAllRoomsForUser(memberUserId) {
    await this.roomStore.deleteRoomsMemberById(memberUserId);
  }

  _extractCdnResources({ overview }) {
    const rawCdnResources = this.githubFlavoredMarkdown.extractCdnResources(overview);
    return consolidateCdnResourcesForSaving(rawCdnResources);
  }
}
