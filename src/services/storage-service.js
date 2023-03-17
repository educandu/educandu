import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import urlUtils from '../utils/url-utils.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { createUniqueStorageFileName, getRoomMediaRoomPath } from '../utils/storage-utils.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';

const logger = new Logger(import.meta.url);
const { BadRequest, NotFound, Forbidden } = httpErrors;

export default class StorageService {
  static dependencies = [
    ServerConfig,
    Cdn,
    RoomStore,
    RoomInvitationStore,
    DocumentStore,
    DocumentRevisionStore,
    StoragePlanStore,
    UserStore,
    CommentStore,
    LockStore,
    TransactionRunner
  ];

  constructor(
    serverConfig,
    cdn,
    roomStore,
    roomInvitationStore,
    documentStore,
    documentRevisionStore,
    storagePlanStore,
    userStore,
    commentStore,
    lockStore,
    transactionRunner
  ) {
    this.cdn = cdn;
    this.lockStore = lockStore;
    this.roomStore = roomStore;
    this.userStore = userStore;
    this.serverConfig = serverConfig;
    this.commentStore = commentStore;
    this.documentStore = documentStore;
    this.storagePlanStore = storagePlanStore;
    this.transactionRunner = transactionRunner;
    this.roomInvitationStore = roomInvitationStore;
    this.documentRevisionStore = documentRevisionStore;
  }

  async getRoomMediaOverview({ user }) {
    const storagePlan = user.storage.planId ? await this.getStoragePlanById(user.storage.planId) : null;
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

      const newOverview = await this.getRoomMediaOverview({ user: roomOwner });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes: newOverview.usedBytes });

      Object.assign(roomOwner, updatedUser);

      return {
        storagePlan: newOverview.storagePlan,
        usedBytes: newOverview.usedBytes,
        roomStorage: newOverview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
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

      const newOverview = await this.getRoomMediaOverview({ user });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: user._id, usedBytes: newOverview.usedBytes });

      Object.assign(user, updatedUser);

      return {
        storagePlan: newOverview.storagePlan,
        usedBytes: newOverview.usedBytes,
        roomStorage: newOverview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
      };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  getAllStoragePlans() {
    return this.storagePlanStore.getAllStoragePlans();
  }

  getAllStoragePlansWithAssignedUserCount() {
    return this.storagePlanStore.getAllStoragePlansWithAssignedUserCount();
  }

  getStoragePlanById(id) {
    return this.storagePlanStore.getStoragePlanById(id);
  }

  async createStoragePlan({ name, maxBytes }) {
    const storagePlan = {
      _id: uniqueId.create(),
      name,
      maxBytes
    };

    await this.storagePlanStore.saveStoragePlan(storagePlan);
    return storagePlan;
  }

  async updateStoragePlan(storagePlanId, { name, maxBytes }) {
    const updatedStoragePlan = {
      _id: storagePlanId,
      name,
      maxBytes
    };

    let lock;
    try {
      lock = await this.lockStore.takeStoragePlanLock(storagePlanId);
      await this.storagePlanStore.saveStoragePlan(updatedStoragePlan);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }

    return updatedStoragePlan;
  }

  async deleteStoragePlanById(storagePlanId) {
    let lock;

    try {
      lock = await this.lockStore.takeStoragePlanLock(storagePlanId);
      const usersExist = await this.userStore.checkUsersWithStoragePlanExistByStoragePlanId(storagePlanId);
      if (usersExist) {
        throw new BadRequest('Storage plan cannot be deleted because it is still in use');
      }

      await this.storagePlanStore.deleteStoragePlanById(storagePlanId);
    } finally {
      if (lock) {
        await this.lockStore.releaseLock(lock);
      }
    }
  }

  async deleteRoomAndResources({ roomId, roomOwnerId }) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(roomOwnerId);
      logger.info(`Deleting room with ID ${roomId}`);

      await this.transactionRunner.run(async session => {
        const documents = await this.documentStore.getDocumentsMetadataByRoomId(roomId, { session });
        const documentIds = documents.map(doc => doc._id);

        await this.commentStore.deleteCommentsByDocumentIds(documentIds, { session });
        await this.documentRevisionStore.deleteDocumentsByRoomId(roomId, { session });
        await this.documentStore.deleteDocumentsByRoomId(roomId, { session });
        await this.roomInvitationStore.deleteRoomInvitationsByRoomId(roomId, { session });
        await this.roomStore.deleteRoomById(roomId, { session });
      });

      await this.cdn.deleteDirectory({ directoryPath: getRoomMediaRoomPath(roomId) });

      const roomOwner = await this.userStore.getUserById(roomOwnerId);
      const { usedBytes } = await this.getRoomMediaOverview({ user: roomOwner });
      await this.userStore.updateUserUsedBytes({ userId: roomOwner._id, usedBytes });
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }
}
