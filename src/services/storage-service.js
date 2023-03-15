import by from 'thenby';
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
import { ensureIsUnique } from '../utils/array-utils.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator } from '../utils/room-utils.js';
import { CDN_URL_PREFIX, STORAGE_DIRECTORY_MARKER_NAME, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { createUniqueStorageFileName, getRoomMediaRoomPath, getStorageLocationTypeForPath } from '../utils/storage-utils.js';

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
    let uploadedFiles = [];

    try {
      lock = await this.lockStore.takeUserLock(storageClaimingUserId);

      const user = await this.userStore.getUserById(storageClaimingUserId);
      const storageLocationType = getStorageLocationTypeForPath(parentPath);

      if (storageLocationType === STORAGE_LOCATION_TYPE.unknown) {
        throw new Error(`Invalid storage path '${parentPath}'`);
      }

      if (!user.storage.planId) {
        throw new Error('Cannot upload to room-media storage without a storage plan');
      }

      const storagePlan = await this.storagePlanStore.getStoragePlanById(user.storage.planId);
      const requiredBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
      const availableBytes = storagePlan.maxBytes - user.storage.usedBytes;

      if (availableBytes < requiredBytes) {
        throw new Error(`Not enough storage space: available ${prettyBytes(availableBytes)}, required ${prettyBytes(requiredBytes)}`);
      }

      uploadedFiles = await this._uploadFiles(files, parentPath);
      usedBytes = await this._updateUserUsedBytes(user._id);
    } finally {
      await this.lockStore.releaseLock(lock);
    }

    return { uploadedFiles, usedBytes };
  }

  async deleteObject({ path, storageClaimingUserId }) {
    let lock;
    let usedBytes = 0;

    try {
      lock = await this.lockStore.takeUserLock(storageClaimingUserId);
      await this._deleteObjects([path]);

      if (getStorageLocationTypeForPath(path) === STORAGE_LOCATION_TYPE.roomMedia) {
        usedBytes = await this._updateUserUsedBytes(storageClaimingUserId);
      }

      return { usedBytes };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async deleteRoomAndResources({ roomId, roomOwnerId }) {
    let lock;
    let usedBytes = 0;

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

      const roomPrivateStorageObjects = await this.getObjects({
        parentPath: getRoomMediaRoomPath(roomId),
        recursive: true,
        includeEmptyObjects: true,
        ignoreNonExistingPath: true
      });

      if (roomPrivateStorageObjects.length) {
        await this._deleteObjects(roomPrivateStorageObjects.map(({ path }) => path));
        usedBytes = await this._updateUserUsedBytes(roomOwnerId);
      }

      return { usedBytes };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async getRoomMediaOverview({ user }) {
    const storagePlan = user.storage.planId ? await this.getStoragePlanById(user.storage.planId) : null;
    const rooms = await this.roomStore.getRoomsByOwnerId(user._id);
    const roomsAndObjects = await Promise.all(rooms.map(async room => {
      const objects = await this.getObjects({ parentPath: getRoomMediaRoomPath(room._id) });
      return { room, objects, usedBytes: objects.reduce((accu, obj) => accu + obj.size, 0) };
    }));

    const totalUsedBytes = roomsAndObjects.reduce((accu, { usedBytes }) => accu + usedBytes, 0);

    return {
      storagePlan: storagePlan || null,
      usedBytes: totalUsedBytes,
      unusedBytes: Math.max(0, (storagePlan?.maxBytes || 0) - totalUsedBytes),
      roomStorageList: roomsAndObjects.map(({ room, objects, usedBytes }) => ({
        roomId: room._id,
        roomName: room.name,
        objects,
        usedBytes
      }))
    };
  }

  async deleteOwnRoomMedia({ user, roomId, name }) {
    let lock;
    try {
      lock = await this.lockStore.takeUserLock(user._id);

      const room = await this.roomStore.getRoomById(roomId);
      if (!isRoomOwner({ room, userId: user._id })) {
        throw new Forbidden(`User is not authorized to access room '${roomId}'`);
      }

      const objects = await this.getObjects({ parentPath: getRoomMediaRoomPath(roomId) });
      const itemToDelete = objects.find(obj => obj.displayName === name);
      if (!itemToDelete) {
        throw new NotFound(`Object '${name}' could not be found`);
      }

      await this._deleteObjects([itemToDelete.path]);

      const newOverview = await this.getRoomMediaOverview({ user });
      const updatedUser = await this.userStore.updateUserUsedBytes({ userId: user._id, usedBytes: newOverview.usedBytes });

      Object.assign(user, updatedUser);

      return {
        storagePlan: newOverview.storagePlan,
        usedBytes: newOverview.usedBytes,
        unusedBytes: newOverview.unusedBytes,
        roomStorage: newOverview.roomStorageList.find(roomStorage => roomStorage.roomId === roomId)
      };
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async getRoomStorage({ user, documentId }) {
    if (!user || !documentId) {
      return null;
    }

    const doc = await this.documentStore.getDocumentById(documentId);

    if (!doc?.roomId) {
      return null;
    }

    const room = await this.roomStore.getRoomById(doc.roomId);
    const roomOwner = isRoomOwner({ room, userId: user._id }) ? user : await this.userStore.getUserById(room.owner);

    if (!roomOwner.storage.planId) {
      return null;
    }

    const roomOwnerStoragePlan = await this.storagePlanStore.getStoragePlanById(roomOwner.storage.planId);

    return {
      usedBytes: roomOwner.storage.usedBytes,
      maxBytes: roomOwnerStoragePlan.maxBytes,
      path: getRoomMediaRoomPath(room._id),
      isDeletionEnabled: isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })
    };
  }

  async updateUserUsedBytes(userId) {
    let lock;

    try {
      lock = await this.lockStore.takeUserLock(userId);

      const usedBytes = await this._updateUserUsedBytes(userId);

      return usedBytes;
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }

  async _calculateUserUsedBytes(userId) {
    const roomIds = await this.roomStore.getRoomIdsByOwnerId({ ownerId: userId });
    const storagePaths = roomIds.map(getRoomMediaRoomPath);

    let totalSize = 0;
    for (const storagePath of storagePaths) {
      const size = await this._getDirectorySize(storagePath);
      totalSize += size;
    }
    return totalSize;
  }

  async _getDirectorySize(directoryPath) {
    const prefix = `${directoryPath}/`;
    const objects = await this.cdn.listObjects({ prefix, recursive: true });
    return objects.reduce((totalSize, obj) => totalSize + obj.size, 0);
  }

  async _uploadFiles(files, parentPath) {
    const cdnPathByOriginalName = files.reduce((map, file) => {
      const uniqueFileName = createUniqueStorageFileName(file.originalname);
      map[file.originalname] = urlUtils.concatParts(parentPath, uniqueFileName);
      return map;
    }, {});

    const originalNameByCdnPath = Object.fromEntries(Object.entries(cdnPathByOriginalName).map(([key, value]) => [value, key]));

    await Promise.all(files.map(file => this.cdn.uploadObject(cdnPathByOriginalName[file.originalname], file.path)));

    const objects = await this.getObjects({
      parentPath,
      recursive: true,
      includeEmptyObjects: true,
      ignoreNonExistingPath: true
    });

    return objects.reduce((uploadedFiles, obj) => {
      const originalName = originalNameByCdnPath[obj.path];
      if (originalName) {
        uploadedFiles[originalName] = obj;
      }

      return uploadedFiles;
    }, {});
  }

  async _updateUserUsedBytes(userId) {
    const usedBytes = await this._calculateUserUsedBytes(userId);
    const user = await this.userStore.getUserById(userId);
    user.storage = { ...user.storage, usedBytes };

    await this.userStore.saveUser(user);
    return usedBytes;
  }

  async getObjects({ parentPath, recursive = false, includeEmptyObjects = false, ignoreNonExistingPath = false }) {
    const parentPathSegments = parentPath.split('/').filter(seg => !!seg);

    const prefix = parentPathSegments.length ? `${parentPathSegments.join('/')}/` : '';
    const cdnObjects = await this.cdn.listObjects({ prefix, recursive });

    if (!ignoreNonExistingPath && !cdnObjects.length) {
      throw new NotFound();
    }

    const objects = ensureIsUnique(
      cdnObjects
        .map(obj => {
          const path = obj.name || '';
          const objectSegments = path.split('/').filter(seg => !!seg);
          const lastSegment = objectSegments[objectSegments.length - 1];
          const encodedObjectSegments = objectSegments.map(s => encodeURIComponent(s));

          if (!includeEmptyObjects && lastSegment === STORAGE_DIRECTORY_MARKER_NAME) {
            return null;
          }

          return {
            displayName: lastSegment,
            parentPath: objectSegments.slice(0, -1).join('/'),
            path: objectSegments.join('/'),
            url: [this.serverConfig.cdnRootUrl, ...encodedObjectSegments].join('/'),
            portableUrl: `${CDN_URL_PREFIX}${encodedObjectSegments.join('/')}`,
            createdOn: obj.lastModified,
            updatedOn: obj.lastModified,
            size: obj.size
          };
        })
        .filter(obj => obj),
      obj => obj.portableUrl
    );

    return objects.sort(by(obj => obj.displayName));
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
