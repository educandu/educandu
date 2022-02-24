import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class UserController {
  static get inject() { return [ServerConfig, PageRenderer, RoomService, ClientDataMappingService]; }

  constructor(serverConfig, pageRenderer, roomService, clientDataMappingService) {
    this.serverConfig = serverConfig;
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetMySpacePage(req, res) {
    const { user } = req;

    let rooms = [];
    if (this.serverConfig.areRoomsEnabled) {
      rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
    }
    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMappingService.mapRoom(room, user)));

    const initialState = { rooms: mappedRooms };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.mySpace, initialState);
  }

  registerPages(router) {
    router.get(
      '/my-space',
      needsAuthentication(),
      (req, res) => this.handleGetMySpacePage(req, res)
    );
  }
}

export default UserController;
