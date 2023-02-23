import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { ROOM_DOCUMENTS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getDocumentMediaDocumentPath, getRoomMediaRoomPath } from '../utils/storage-utils.js';

class TestsController {
  static dependencies = [PageRenderer, DocumentService, RoomService, StorageService];

  constructor(pageRenderer, documentService, roomService, storageService) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.roomService = roomService;
    this.storageService = storageService;
  }

  async handleGetTestsPage(req, res) {
    const { user } = req;
    const initialState = {};

    const locations = [];

    const docs = await this.documentService.getAllPublicDocumentsMetadata();
    const doc = docs[0];

    if (doc) {
      locations.push({
        type: STORAGE_LOCATION_TYPE.documentMedia,
        path: getDocumentMediaDocumentPath(doc._id),
        usedBytes: 0,
        maxBytes: 0,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)
      });
    }

    const rooms = await this.roomService.getRoomsOwnedByUser(user?._id || 'hihi');
    const room = rooms[0];

    if (room) {
      const isRoomOwner = user._id === room.owner;
      const isRoomCollaborator = room.documentsMode === ROOM_DOCUMENTS_MODE.collaborative && room.members.some(m => m.userId === user._id);

      const roomOwner = isRoomOwner ? user : await this.userStore.getUserById(room.owner);
      const roomOwnerStoragePlan = roomOwner.storage.plan ? await this.storageService.getStoragePlanById(roomOwner.storage.plan) : null;

      locations.push({
        type: STORAGE_LOCATION_TYPE.roomMedia,
        path: getRoomMediaRoomPath(room._id),
        usedBytes: roomOwner.storage.usedBytes,
        maxBytes: roomOwnerStoragePlan?.maxBytes,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE) || isRoomOwner || isRoomCollaborator
      });
    }

    // Hack the manipulated locations into the current request:
    req.storage = { ...req.storage, locations };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  registerPages(router) {
    router.get(
      '/tests',
      needsPermission(permissions.ADMIN),
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }
}

export default TestsController;
