import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import DocumentService from '../services/document-service.js';
import { getRoomMediaRoomPath } from '../utils/storage-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class TestsController {
  static dependencies = [PageRenderer, DocumentService, RoomService, ClientDataMappingService];

  constructor(pageRenderer, documentService, roomService, clientDataMappingService) {
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.roomService = roomService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetTestsPage(req, res) {
    const { user } = req;

    const rooms = await this.roomService.getRoomsOwnedByUser(user?._id || 'hihi');
    const room = rooms[0] || null;

    let roomMediaContext;
    if (room) {
      const { storagePlan, usedBytes } = await this.roomService.getAllRoomMedia({ user, roomId: room._id });
      roomMediaContext = storagePlan || usedBytes
        ? {
          roomId: room._id,
          path: getRoomMediaRoomPath(room._id),
          usedBytes: usedBytes || 0,
          maxBytes: storagePlan?.maxBytes || 0,
          isDeletionEnabled: true
        }
        : null;
    } else {
      roomMediaContext = null;
    }

    const mappedRoom = room ? await this.clientDataMappingService.mapRoom({ room, viewingUser: user }) : null;
    const initialState = { room: mappedRoom, roomMediaContext };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.tests, initialState);
  }

  registerPages(router) {
    router.get(
      '/tests',
      needsPermission(permissions.MANAGE_SETUP),
      (req, res) => this.handleGetTestsPage(req, res)
    );
  }
}

export default TestsController;
