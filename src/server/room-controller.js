import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import { roomSchema } from '../domain/schemas/rooms-schemas.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { FEATURE_TOGGLES } from '../common/constants.js';

export default class RoomController {
  static get inject() { return [ServerConfig, RoomService]; }

  constructor(serverConfig, roomService) {
    this.roomService = roomService;
    this.serverConfig = serverConfig;
  }

  registerApi(router) {
    if (this.serverConfig.disabledFeatures.includes(FEATURE_TOGGLES.rooms)) {
      return;
    }

    router.post('/api/v1/rooms', [needsPermission(permissions.CREATE_ROOMS), validateBody(roomSchema)], async (req, res) => {
      const newRoom = await this.roomService.createRoom(req.body);
      return res.send(newRoom);
    });
  }
}
