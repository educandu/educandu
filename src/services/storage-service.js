import urls from '../utils/urls.js';
import prettyBytes from 'pretty-bytes';
import Cdn from '../repositories/cdn.js';
import UserStore from '../stores/user-store.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import LessonStore from '../stores/lesson-store.js';
import fileNameHelper from '../utils/file-name-helper.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import {
  getPrivateStoragePathForRoomId,
  getPrefixFromStoragePath,
  getStoragePathType,
  STORAGE_PATH_TYPE
} from '../ui/path-helper.js';

export default class StorageService {
  static get inject() { return [Cdn, RoomStore, RoomInvitationStore, LessonStore, StoragePlanStore, UserStore, LockStore, TransactionRunner]; }

  constructor(cdn, roomStore, roomInvitationStore, lessonStore, storagePlanStore, userStore, lockStore, transactionRunner) {
    this.cdn = cdn;
    this.lockStore = lockStore;
    this.roomStore = roomStore;
    this.userStore = userStore;
    this.lessonStore = lessonStore;
    this.storagePlanStore = storagePlanStore;
    this.transactionRunner = transactionRunner;
    this.roomInvitationStore = roomInvitationStore;
  }

  getAllStoragePlans() {
    return this.storagePlanStore.getAllStoragePlans();
  }

  getStoragePlanById(id) {
    return this.storagePlanStore.getStoragePlanById(id);
  }

  async uploadFiles({ prefix, files, userId }) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(userId);

      const user = await this.userStore.getUserById(userId);
      const storagePathType = getStoragePathType(prefix);

      if (storagePathType === STORAGE_PATH_TYPE.unknown) {
        throw new Error(`Invalid storage path '${prefix}'`);
      }

      if (storagePathType === STORAGE_PATH_TYPE.public) {
        await this._uploadFiles(files, prefix);
        return;
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

      await this._uploadFiles(files, prefix);
      await this._updateUserUsedBytes(user._id);
    } finally {
      this.lockStore.releaseLock(lock);
    }
  }

  async listObjects({ prefix, recursive }) {
    const objects = await this.cdn.listObjects({ prefix, recursive });
    return objects;
  }

  async deleteObject({ prefix, objectName, userId }) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(userId);
      await this._deleteObjects([urls.concatParts(prefix, objectName)]);

      if (getStoragePathType(prefix) === STORAGE_PATH_TYPE.private) {
        await this._updateUserUsedBytes(userId);
      }
    } finally {
      this.lockStore.releaseLock(lock);
    }
  }

  async deleteRoomAndResources({ roomId, roomOwnerId }) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(roomOwnerId);

      await this.transactionRunner.run(async session => {
        await this.lessonStore.deleteLessonsByRoomId(roomId, { session });
        await this.roomInvitationStore.deleteRoomInvitationsByRoomId(roomId, { session });
        await this.roomStore.deleteRoomById(roomId, { session });
      });

      const roomPrivateStorageObjects = await this.listObjects({ prefix: getPrivateStoragePathForRoomId(roomId), recursive: true });
      if (roomPrivateStorageObjects.length) {
        await this._deleteObjects(roomPrivateStorageObjects.map(({ name }) => name));
        await this._updateUserUsedBytes(roomOwnerId);
      }
    } finally {
      this.lockStore.releaseLock(lock);
    }
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

  async _getFolderSize(prefix) {
    const objects = await this.cdn.listObjects({ prefix, recursive: true });
    return objects.reduce((totalSize, obj) => totalSize + obj.size, 0);
  }

  async _uploadFiles(files, prefix) {
    const uploads = files.map(async file => {
      const cdnFileName = fileNameHelper.buildCdnFileName(file.originalname, prefix);
      await this.cdn.uploadObject(cdnFileName, file.path, {});
    });
    await Promise.all(uploads);
  }

  async _updateUserUsedBytes(userId) {
    const usedBytes = await this._calculateUserUsedBytes(userId);
    const user = await this.userStore.getUserById(userId);
    user.storage = { ...user.storage, usedBytes };

    await this.userStore.saveUser(user);
    return user;
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
