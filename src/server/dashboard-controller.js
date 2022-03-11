import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import DashboardService from '../services/dashboard-service.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';

class UserController {
  static get inject() { return [ServerConfig, PageRenderer, DashboardService, RoomService, ClientDataMappingService]; }

  constructor(serverConfig, pageRenderer, dashboardService, roomService, clientDataMappingService) {
    this.roomService = roomService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.dashboardService = dashboardService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetDashboardPage(req, res) {
    const { user } = req;

    let rooms = [];
    if (this.serverConfig.areRoomsEnabled) {
      rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
    }
    const activities = await this.dashboardService.getUserActivities({ userId: user._id, limit: 10 });
    const favorites = await this.dashboardService.getUserFavorites(user._id);

    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMappingService.mapRoom(room, user)));
    const mappedActivities = this.clientDataMappingService.mapUserActivities(activities);
    const mappedFavorites = this.clientDataMappingService.mapUserFavorites(favorites);

    const initialState = { rooms: mappedRooms, activities: mappedActivities, favorites: mappedFavorites };

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
