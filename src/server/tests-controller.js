import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import DocumentService from '../services/document-service.js';
import { getRoomMediaRoomPath } from '../utils/storage-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

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

    let storage;
    const initialState = {};

    const rooms = await this.roomService.getRoomsOwnedByUser(user?._id || 'hihi');
    const room = rooms[0];

    if (room) {
      const isRoomOwner = user._id === room.owner;
      const isRoomCollaborator = room.isCollaborative && room.members.some(m => m.userId === user._id);

      const roomOwner = isRoomOwner ? user : await this.userStore.getUserById(room.owner);
      const roomOwnerStoragePlan = roomOwner.storage.plan ? await this.storageService.getStoragePlanById(roomOwner.storage.plan) : null;

      storage = {
        path: getRoomMediaRoomPath(room._id),
        usedBytes: roomOwner.storage.usedBytes,
        maxBytes: roomOwnerStoragePlan?.maxBytes,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE) || isRoomOwner || isRoomCollaborator
      };
    }

    // Hack the manipulated storage into the current request:
    req.storage = { ...req.storage, storage };

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
