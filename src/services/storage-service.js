import urls from '../utils/urls.js';
import prettyBytes from 'pretty-bytes';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import RoomStore from '../stores/room-store.js';
import fileNameHelper from '../utils/file-name-helper.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import {
  getObjectNameWithoutPrefixFromStoragePath,
  getPrefixFromStoragePath,
  getPrivateStoragePathForRoomId,
  getStoragePathType,
  STORAGE_PATH_TYPE
} from '../ui/path-helper.js';

export default class StorageService {
  static get inject() { return [Cdn, RoomStore, UserService]; }

  constructor(cdn, roomStore, userService) {
    this.cdn = cdn;
    this.roomStore = roomStore;
    this.userService = userService;
  }

  async uploadFiles({ prefix, files, user }) {
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

    const storagePlan = await this.userService.getStoragePlanById(user.storage.plan);
    const requiredBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
    const availableBytes = storagePlan.maxBytes - user.storage.usedBytes;

    if (availableBytes < requiredBytes) {
      throw new Error(`Not enough storage space: available ${prettyBytes(availableBytes)}, required ${prettyBytes(requiredBytes)}`);
    }

    await this._uploadFiles(files, prefix);
    const usedBytes = await this._getUsedPrivateStorageUsedBytes(user._id);
    await this.userService.updateUserUsedStorage(user._id, usedBytes);
  }

  async listObjects({ prefix, recursive }) {
    const objects = await this.cdn.listObjects({ prefix, recursive });
    return objects;
  }

  async deleteAllObjectsWithPrefix({ prefix, user }) {
    const objectList = await this.listObjects({ prefix, recursive: true });
    await this.deleteObjects({ paths: objectList.map(({ name }) => name), user });
  }

  async deleteObjects({ paths, user }) {
    const allObjectsToDelete = paths.map(path => ({
      fullObjectName: path,
      prefix: getPrefixFromStoragePath(path),
      objectNameWithoutPrefix: getObjectNameWithoutPrefixFromStoragePath(path),
      storagePathType: getStoragePathType(path)
    }));

    const objectWithUnknownPathType = allObjectsToDelete.find(obj => obj.storagePathType === STORAGE_PATH_TYPE.unknown);
    if (objectWithUnknownPathType) {
      throw new Error(`Invalid storage path '${objectWithUnknownPathType.prefix}'`);
    }

    await this.cdn.deleteObjects(allObjectsToDelete.map(obj => obj.fullObjectName));

    if (allObjectsToDelete.some(x => x.storagePathType === STORAGE_PATH_TYPE.private)) {
      const usedBytes = await this._getUsedPrivateStorageUsedBytes(user._id);
      await this.userService.updateUserUsedStorage(user._id, usedBytes);
    }
  }

  async deleteObject({ prefix, objectName, user }) {
    await this.deleteObjects({ paths: [urls.concatParts(prefix, objectName)], user });
  }

  async getIdsOfPrivateRoomsOwnedByUser(userId) {
    const roomsProjection = await this.roomStore.find(
      { $and: [{ owner: userId }, { access: ROOM_ACCESS_LEVEL.private }] },
      { projection: { _id: 1 } }
    );
    return roomsProjection.map(projection => projection._id);
  }

  async _getUsedPrivateStorageUsedBytes(userId) {
    const privateRoomsIds = await this.getIdsOfPrivateRoomsOwnedByUser(userId);
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
    const objects = await this.cdn.listObjects({ prefix });
    return objects.reduce((totalSize, obj) => totalSize + obj.size, 0);
  }

  async _uploadFiles(files, prefix) {
    const uploads = files.map(async file => {
      const cdnFileName = fileNameHelper.buildCdnFileName(file.originalname, prefix);
      await this.cdn.uploadObject(cdnFileName, file.path, {});
    });
    await Promise.all(uploads);
  }
}
