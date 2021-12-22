import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import { FEATURE_TOGGLES } from '../common/constants.js';
import ClientDataMapper from '../server/client-data-mapper.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';

class UserController {
  static get inject() { return [ServerConfig, PageRenderer, RoomService, ClientDataMapper]; }

  constructor(serverConfig, pageRenderer, roomService, clientDataMapper) {
    this.serverConfig = serverConfig;
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.clientDataMapper = clientDataMapper;
  }

  async handleGetMySpacePage(req, res) {
    const { user } = req;

    let rooms = [];
    if (!this.serverConfig.disabledFeatures.includes(FEATURE_TOGGLES.rooms)) {
      rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
    }

    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMapper.mapRoom(room, user)));
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
