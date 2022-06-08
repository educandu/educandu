import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import { ROOM_ACCESS_LEVEL, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

class TestsController {
  static get inject() { return [PageRenderer, RoomService]; }

  constructor(pageRenderer, roomService) {
    this.pageRenderer = pageRenderer;
    this.roomService = roomService;
  }

  async handleGetTestsPage(req, res) {
    const initialState = {};

    const locations = [
      {
        type: STORAGE_LOCATION_TYPE.public,
        rootPath: 'media',
        initialPath: 'media',
        uploadPath: 'media',
        isDeletionEnabled: hasUserPermission(req.user, permissions.DELETE_ANY_STORAGE_FILE)
      }
    ];

    const rooms = await this.roomService.getRoomsOwnedByUser(req.user?._id || 'hihi');
    const privateRoom = rooms.find(r => r.access === ROOM_ACCESS_LEVEL.private);
    if (privateRoom) {
      locations.push({
        type: STORAGE_LOCATION_TYPE.private,
        rootPath: `rooms/${privateRoom._id}/media`,
        initialPath: `rooms/${privateRoom._id}/media`,
        uploadPath: `rooms/${privateRoom._id}/media`,
        isDeletionEnabled: hasUserPermission(req.user, permissions.DELETE_ANY_STORAGE_FILE)
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
