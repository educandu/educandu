import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import { roomSchema } from '../domain/schemas/rooms-schemas.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';

export default class RoomsController {
  static get indeject() { return [RoomService]; }

  constructor(roomService) {
    this.roomService = roomService;
  }

  registerApi(router) {
    router.post('/api/v1/rooms', [needsPermission(permissions.CREATE_ROOMS), validateBody(roomSchema)], async (req, res) => {
      const newRoom = await this.roomService.createRoom(req.body);
      return res.send(newRoom);
    });
  }
}
