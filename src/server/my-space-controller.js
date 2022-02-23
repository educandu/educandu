import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import StorageService from '../services/storage-service.js';
import ClientDataMapper from '../server/client-data-mapper.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';

class UserController {
  static get inject() { return [ServerConfig, PageRenderer, RoomService, StorageService, ClientDataMapper]; }

  constructor(serverConfig, pageRenderer, roomService, storageService, clientDataMapper) {
    this.serverConfig = serverConfig;
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.storageService = storageService;
    this.clientDataMapper = clientDataMapper;
  }

  async handleGetMySpacePage(req, res) {
    const { user } = req;

    let storagePlan = null;
    if (user.storage.plan) {
      storagePlan = await this.storageService.getStoragePlanById(user.storage.plan);
    }

    let rooms = [];
    if (this.serverConfig.areRoomsEnabled) {
      rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
    }
    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMapper.mapRoom(room, user)));

    const initialState = { storagePlan, rooms: mappedRooms };

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
