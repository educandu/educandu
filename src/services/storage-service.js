import httpErrors from 'http-errors';
import prettyBytes from 'pretty-bytes';
import Cdn from '../repositories/cdn.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import LessonStore from '../stores/lesson-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import { componseUniqueFileName } from '../utils/path-utils.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { CDN_OBJECT_TYPE, ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getPrivateStoragePathForRoomId, getPrefixFromStoragePath, getStoragePathType, STORAGE_PATH_TYPE, getPathSegments } from '../ui/path-helper.js';

const { BadRequest } = httpErrors;

export default class StorageService {
  static get inject() { return [ServerConfig, Cdn, RoomStore, RoomInvitationStore, LessonStore, StoragePlanStore, UserStore, LockStore, TransactionRunner]; }

  // eslint-disable-next-line max-params
  constructor(serverConfig, cdn, roomStore, roomInvitationStore, lessonStore, storagePlanStore, userStore, lockStore, transactionRunner) {
    this.cdn = cdn;
    this.lockStore = lockStore;
    this.roomStore = roomStore;
    this.userStore = userStore;
    this.lessonStore = lessonStore;
    this.serverConfig = serverConfig;
    this.storagePlanStore = storagePlanStore;
    this.transactionRunner = transactionRunner;
    this.roomInvitationStore = roomInvitationStore;
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

  async uploadFiles({ parentPath, files, storageClaimingUserId }) {
    let lock;
    let usedBytes = 0;

    try {
      lock = await this.lockStore.takeUserLock(storageClaimingUserId);

      const user = await this.userStore.getUserById(storageClaimingUserId);
      const storagePathType = getStoragePathType(parentPath);

      if (storagePathType === STORAGE_PATH_TYPE.unknown) {
        throw new Error(`Invalid storage path '${parentPath}'`);
      }

      if (storagePathType === STORAGE_PATH_TYPE.public) {
        await this._uploadFiles(files, parentPath);
        return { usedBytes };
      }

      if (!user.storage.plan) {
        throw new Error('Cannot upload to private storage without a storage plan');
      }

      const storagePlan = await this.storagePlanStore.getStoragePlanById(user.storage.plan);
      const requiredBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
      const availableBytes = storagePlan.maxBytes - user.storage.usedBytes;

      if (availableBytes < requiredBytes) {
        throw new Error(`Not enough storage space: available ${prettyBytes(availableBytes)}, required ${prettyBytes(requiredBytes)}`);
      }

      await this._uploadFiles(files, parentPath);
      usedBytes = await this._updateUserUsedBytes(user._id);
    } finally {
      this.lockStore.releaseLock(lock);
    }

    return { usedBytes };
  }

  async getObjects({ parentPath, recursive }) {
    const prefix = parentPath ? `${parentPath}/` : '';
    const objects = await this.cdn.listObjects({ prefix, recursive });

    const mappedObjects = objects.map(obj => {
      const isDirectory = !!obj.prefix;
      const segments = getPathSegments(isDirectory ? obj.prefix : obj.name);
      const encodedSegments = segments.map(s => encodeURIComponent(s));
      return {
        displayName: segments[segments.length - 1],
        parentPath: segments.slice(0, -1).join('/'),
        path: segments.join('/'),
        url: [this.serverConfig.cdnRootUrl, ...encodedSegments].join('/'),
        portableUrl: `cdn://${encodedSegments.join('/')}`,
        createdOn: isDirectory ? null : obj.lastModified,
        type: isDirectory ? CDN_OBJECT_TYPE.directory : CDN_OBJECT_TYPE.file,
        size: isDirectory ? null : obj.size
      };
    });

    return mappedObjects;
  }

  async deleteObject({ path, storageClaimingUserId }) {
    let lock;
    let usedBytes = 0;

    try {
      lock = await this.lockStore.takeUserLock(storageClaimingUserId);
      await this._deleteObjects([path]);

      if (getStoragePathType(path) === STORAGE_PATH_TYPE.private) {
        usedBytes = await this._updateUserUsedBytes(storageClaimingUserId);
      }

      return { usedBytes };
    } finally {
      this.lockStore.releaseLock(lock);
    }
  }

  async deleteRoomAndResources({ roomId, roomOwnerId }) {
    let lock;
    let usedBytes = 0;

    try {
      lock = await this.lockStore.takeUserLock(roomOwnerId);

      await this.transactionRunner.run(async session => {
        await this.lessonStore.deleteLessonsByRoomId(roomId, { session });
        await this.roomInvitationStore.deleteRoomInvitationsByRoomId(roomId, { session });
        await this.roomStore.deleteRoomById(roomId, { session });
      });

      const roomPrivateStorageObjects = await this.getObjects({ parentPath: getPrivateStoragePathForRoomId(roomId), recursive: true });
      if (roomPrivateStorageObjects.length) {
        await this._deleteObjects(roomPrivateStorageObjects.map(({ path }) => path));
        usedBytes = await this._updateUserUsedBytes(roomOwnerId);
      }

      return { usedBytes };
    } finally {
      this.lockStore.releaseLock(lock);
    }
  }

  async getStorageLocations({ user, documentId, lessonId }) {
    const locations = [];

    if (!user) {
      return locations;
    }

    if (documentId || lessonId) {
      locations.push({
        type: STORAGE_LOCATION_TYPE.public,
        rootPath: 'media',
        initialPath: `media/${documentId || lessonId}`,
        uploadPath: `media/${documentId || lessonId}`,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)
      });
    }

    if (lessonId) {
      const lesson = await this.lessonStore.getLessonById(lessonId);
      const room = await this.roomStore.getRoomById(lesson.roomId);
      const isRoomOwner = user._id === room.owner;
      const isRoomCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.some(m => m.userId === user._id);

      const roomOwner = isRoomOwner ? user : await this.userStore.getUserById(room.owner);

      if (roomOwner.storage.plan) {
        const roomOwnerStoragePlan = await this.storagePlanStore.getStoragePlanById(roomOwner.storage.plan);

        locations.push({
          type: STORAGE_LOCATION_TYPE.private,
          usedBytes: roomOwner.storage.usedBytes,
          maxBytes: roomOwnerStoragePlan.maxBytes,
          rootPath: `rooms/${room._id}/media`,
          initialPath: `rooms/${room._id}/media`,
          uploadPath: `rooms/${room._id}/media`,
          isDeletionEnabled: isRoomOwner || isRoomCollaborator
        });
      }
    }

    return locations;
  }

  async _calculateUserUsedBytes(userId) {
    const privateRoomsIds = await this.roomStore.getRoomIdsByOwnerIdAndAccess({ ownerId: userId, access: ROOM_ACCESS_LEVEL.private });
    const storagePaths = privateRoomsIds.map(getPrivateStoragePathForRoomId);

    let totalSize = 0;
    for (const storagePath of storagePaths) {
      // eslint-disable-next-line no-await-in-loop
      const size = await this._getFolderSize(storagePath);
      totalSize += size;
    }
    return totalSize;
  }

  async _getFolderSize(folderPath) {
    const prefix = `${folderPath}/`;
    const objects = await this.cdn.listObjects({ prefix, recursive: true });
    return objects.reduce((totalSize, obj) => totalSize + obj.size, 0);
  }

  async _uploadFiles(files, parentPath) {
    const uploads = files.map(async file => {
      const fileName = componseUniqueFileName(file.originalname, parentPath);
      await this.cdn.uploadObject(fileName, file.path, {});
    });
    await Promise.all(uploads);
  }

  async _updateUserUsedBytes(userId) {
    const usedBytes = await this._calculateUserUsedBytes(userId);
    const user = await this.userStore.getUserById(userId);
    user.storage = { ...user.storage, usedBytes };

    await this.userStore.saveUser(user);
    return usedBytes;
  }

  async _deleteObjects(paths) {
    const allObjectsToDelete = paths.map(path => ({
      fullObjectName: path,
      prefix: getPrefixFromStoragePath(path),
      storagePathType: getStoragePathType(path)
    }));

    const objectWithUnknownPathType = allObjectsToDelete.find(obj => obj.storagePathType === STORAGE_PATH_TYPE.unknown);
    if (objectWithUnknownPathType) {
      throw new Error(`Invalid storage path '${objectWithUnknownPathType.prefix}'`);
    }

    await this.cdn.deleteObjects(allObjectsToDelete.map(obj => obj.fullObjectName));
  }
}
