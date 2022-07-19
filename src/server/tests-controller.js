import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import StorageService from '../services/storage-service.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';
import { ROOM_ACCESS, ROOM_LESSONS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';

class TestsController {
  static get inject() { return [PageRenderer, RoomService, StorageService]; }

  constructor(pageRenderer, roomService, storageService) {
    this.pageRenderer = pageRenderer;
    this.roomService = roomService;
    this.storageService = storageService;
  }

  async handleGetTestsPage(req, res) {
    const { user } = req;
    const initialState = {};

    const locations = [
      {
        type: STORAGE_LOCATION_TYPE.public,
        rootPath: 'media',
        homePath: 'media',
        usedBytes: 0,
        maxBytes: 0,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE)
      }
    ];

    const rooms = await this.roomService.getRoomsOwnedByUser(user?._id || 'hihi');
    const privateRoom = rooms.find(r => r.access === ROOM_ACCESS.private);

    if (privateRoom) {
      const isRoomOwner = user._id === privateRoom.owner;
      const isRoomCollaborator = privateRoom.lessonsMode === ROOM_LESSONS_MODE.collaborative && privateRoom.members.some(m => m.userId === user._id);

      const roomOwner = isRoomOwner ? user : await this.userStore.getUserById(privateRoom.owner);
      const roomOwnerStoragePlan = roomOwner.storage.plan ? await this.storageService.getStoragePlanById(roomOwner.storage.plan) : null;

      locations.push({
        type: STORAGE_LOCATION_TYPE.private,
        rootPath: `rooms/${privateRoom._id}/media`,
        homePath: `rooms/${privateRoom._id}/media`,
        usedBytes: roomOwner.storage.usedBytes,
        maxBytes: roomOwnerStoragePlan?.maxBytes,
        isDeletionEnabled: hasUserPermission(user, permissions.DELETE_ANY_STORAGE_FILE) || isRoomOwner || isRoomCollaborator
      });
    }

    // Hack
    req.storage = { ...req.storage, locations };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  registerPages(router) {
    router.get(
      '/tests',
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }
}

export default TestsController;
