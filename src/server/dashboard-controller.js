import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import { USER_ACTIVITY_TYPE } from '../domain/constants.js';
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

  async handleGetDashboardPage(req, res) {
    const { user } = req;

    let rooms = [];
    if (this.serverConfig.areRoomsEnabled) {
      rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
    }
    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMappingService.mapRoom(room, user)));

    const activities = [
      { type: USER_ACTIVITY_TYPE.documentCreated, timestamp: new Date().toISOString(), data: { title: 'My document', _id: '' } },
      { type: USER_ACTIVITY_TYPE.documentUpdated, timestamp: new Date().toISOString(), data: { title: 'My document', _id: '' } },
      { type: USER_ACTIVITY_TYPE.documentMarkedFavorite, timestamp: new Date().toISOString(), data: { title: 'Some document', _id: '' } },
      { type: USER_ACTIVITY_TYPE.roomCreated, timestamp: new Date().toISOString(), data: { title: 'My room', _id: '' } },
      { type: USER_ACTIVITY_TYPE.roomUpdated, timestamp: new Date().toISOString(), data: { title: 'My room', _id: '' } },
      { type: USER_ACTIVITY_TYPE.roomMarkedFavorite, timestamp: new Date().toISOString(), data: { title: 'Some room', _id: '' } },
      { type: USER_ACTIVITY_TYPE.roomJoined, timestamp: new Date().toISOString(), data: { title: 'Other room', _id: '' } },
      { type: USER_ACTIVITY_TYPE.lessonCreated, timestamp: new Date().toISOString(), data: { title: 'My lesson', _id: '' } },
      { type: USER_ACTIVITY_TYPE.lessonUpdated, timestamp: new Date().toISOString(), data: { title: 'My lesson', _id: '' } },
      { type: USER_ACTIVITY_TYPE.lessonMarkedFavorite, timestamp: new Date().toISOString(), data: { title: 'Some lesson', _id: '' } }
    ];

    const initialState = { rooms: mappedRooms, activities };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.dashboard, initialState);
  }

  registerPages(router) {
    router.get(
      '/dashboard',
      needsAuthentication(),
      (req, res) => this.handleGetDashboardPage(req, res)
    );
  }
}

export default UserController;
