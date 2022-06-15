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
import RoomInvitationStore from '../stores/room-invitation-store.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { CDN_OBJECT_TYPE, ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { componseUniqueFileName, getPathForPrivateRoom, getPublicHomePath, getPublicRootPath, getStorageLocationTypeForPath } from '../utils/storage-utils.js';

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
      const storageLocationType = getStorageLocationTypeForPath(parentPath);

      if (storageLocationType === STORAGE_LOCATION_TYPE.unknown) {
        throw new Error(`Invalid storage path '${parentPath}'`);
      }

      if (storageLocationType === STORAGE_LOCATION_TYPE.public) {
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
    const currentDirectorySegments = parentPath.split('/').filter(seg => !!seg);
    const encodedCurrentDirectorySegments = currentDirectorySegments.map(s => encodeURIComponent(s));

    const currentDirectory = {
      displayName: currentDirectorySegments.length ? currentDirectorySegments[currentDirectorySegments.length - 1] : '',
      parentPath: currentDirectorySegments.length ? currentDirectorySegments.slice(0, -1).join('/') : null,
      path: currentDirectorySegments.join('/'),
      url: [this.serverConfig.cdnRootUrl, ...encodedCurrentDirectorySegments].join('/'),
      portableUrl: `cdn://${encodedCurrentDirectorySegments.join('/')}`,
      createdOn: null,
      type: CDN_OBJECT_TYPE.directory,
      size: null
    };

    let parentDirectory;
    if (currentDirectorySegments.length > 0) {
      const parentDirectorySegments = currentDirectorySegments.slice(0, -1);
      const encodedParentDirectorySegments = encodedCurrentDirectorySegments.slice(0, -1);

      parentDirectory = {
        displayName: parentDirectorySegments.length ? parentDirectorySegments[parentDirectorySegments.length - 1] : '',
        parentPath: parentDirectorySegments.length ? parentDirectorySegments.slice(0, -1).join('/') : null,
        path: parentDirectorySegments.join('/'),
        url: [this.serverConfig.cdnRootUrl, ...encodedParentDirectorySegments].join('/'),
        portableUrl: `cdn://${encodedParentDirectorySegments.join('/')}`,
        createdOn: null,
        type: CDN_OBJECT_TYPE.directory,
        size: null
      };
    } else {
      parentDirectory = null;
    }

    const prefix = currentDirectorySegments.length ? `${currentDirectorySegments.join('/')}/` : '';
    const cdnObjects = await this.cdn.listObjects({ prefix, recursive });

    const objects = cdnObjects.map(obj => {
      const isDirectory = !!obj.prefix;
      const path = isDirectory ? obj.prefix : obj.name;
      const objectSegments = path.split('/').filter(seg => !!seg);
      const encodedObjectSegments = objectSegments.map(s => encodeURIComponent(s));
      return {
        displayName: objectSegments[objectSegments.length - 1],
        parentPath: objectSegments.slice(0, -1).join('/'),
        path: objectSegments.join('/'),
        url: [this.serverConfig.cdnRootUrl, ...encodedObjectSegments].join('/'),
        portableUrl: `cdn://${encodedObjectSegments.join('/')}`,
        createdOn: isDirectory ? null : obj.lastModified,
        type: isDirectory ? CDN_OBJECT_TYPE.directory : CDN_OBJECT_TYPE.file,
        size: isDirectory ? null : obj.size
      };
    });

    return { parentDirectory, currentDirectory, objects };
  }

  async deleteObject({ path, storageClaimingUserId }) {
    let lock;
    let usedBytes = 0;

    try {
      lock = await this.lockStore.takeUserLock(storageClaimingUserId);
      await this._deleteObjects([path]);

      if (getStorageLocationTypeForPath(path) === STORAGE_LOCATION_TYPE.private) {
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

      const { objects: roomPrivateStorageObjects } = await this.getObjects({ parentPath: getPathForPrivateRoom(roomId), recursive: true });
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
        rootPath: getPublicRootPath(),
        homePath: getPublicHomePath(documentId || lessonId),
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)
      });
    }

    if (lessonId) {
      const lesson = await this.lessonStore.getLessonById(lessonId);
      const room = await this.roomStore.getRoomById(lesson.roomId);
      const isRoomOwner = user._id === room.owner;
      const isRoomCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.some(m => m.userId === user._id);
      const rootAndHomePath = getPathForPrivateRoom(room._id);

      const roomOwner = isRoomOwner ? user : await this.userStore.getUserById(room.owner);

      if (roomOwner.storage.plan) {
        const roomOwnerStoragePlan = await this.storagePlanStore.getStoragePlanById(roomOwner.storage.plan);

        locations.push({
          type: STORAGE_LOCATION_TYPE.private,
          usedBytes: roomOwner.storage.usedBytes,
          maxBytes: roomOwnerStoragePlan.maxBytes,
          rootPath: rootAndHomePath,
          homePath: rootAndHomePath,
          isDeletionEnabled: isRoomOwner || isRoomCollaborator
        });
      }
    }

    return locations;
  }

  async _calculateUserUsedBytes(userId) {
    const privateRoomsIds = await this.roomStore.getRoomIdsByOwnerIdAndAccess({ ownerId: userId, access: ROOM_ACCESS_LEVEL.private });
    const storagePaths = privateRoomsIds.map(getPathForPrivateRoom);

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
      await this.cdn.uploadObject(fileName, file.path);
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
    const allObjectsToDelete = paths.map(path => {
      const prefixSegments = (path || '').split('/').filter(seg => seg).slice(0, -1);

      return {
        fullObjectName: path,
        prefix: `${prefixSegments.join('/')}/`,
        storageLocationType: getStorageLocationTypeForPath(path)
      };
    });

    const objectWithUnknownPathType = allObjectsToDelete.find(obj => obj.storageLocationType === STORAGE_LOCATION_TYPE.unknown);
    if (objectWithUnknownPathType) {
      throw new Error(`Invalid storage path '${objectWithUnknownPathType.prefix}'`);
    }

    await this.cdn.deleteObjects(allObjectsToDelete.map(obj => obj.fullObjectName));
  }
}
