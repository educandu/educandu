import urls from '../utils/urls.js';
import prettyBytes from 'pretty-bytes';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import RoomService from './room-service.js';
import fileNameHelper from '../utils/file-name-helper.js';
import { getPrivateStoragePathForRoomId, getStoragePathType, STORAGE_PATH_TYPE } from '../ui/path-helper.js';

export default class CdnService {
  static get inject() { return [Cdn, UserService, RoomService]; }

  constructor(cdn, userService, roomService) {
    this.cdn = cdn;
    this.userService = userService;
    this.roomService = roomService;
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

    if (!user.storage?.plan) {
      throw new Error('Cannot upload to private storage without a storage plan');
    }

    const storagePlan = await this.userService.getStoragePlanById(user.storage.plan);
    const requiredStorageInBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
    const availableStorageInBytes = storagePlan.maxSizeInBytes - user.storage.usedStorageInBytes;

    if (availableStorageInBytes < requiredStorageInBytes) {
      throw new Error(`Not enough storage space: available ${prettyBytes(availableStorageInBytes)}, required ${prettyBytes(requiredStorageInBytes)}`);
    }

    await this._uploadFiles(files, prefix);
    const usedStorageInBytes = await this._getUsedPrivateStorageSizeInBytes(user._id);
    await this.userService.updateUserUsedStorage(user._id, usedStorageInBytes);
  }

  async listObjects({ prefix, recursive }) {
    const objects = await this.cdn.listObjects({ prefix, recursive });
    return objects;
  }

  async deleteObject({ prefix, objectName }) {
    await this.cdn.deleteObject(urls.concatParts(prefix, objectName));
  }

  async _getUsedPrivateStorageSizeInBytes(userId) {
    const privateRoomsIds = await this.roomService.getIdsOfPrivateRoomsOwnedByUser(userId);
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
