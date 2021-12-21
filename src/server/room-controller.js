import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { roomDetailsParamSchema, roomSchema } from '../domain/schemas/rooms-schemas.js';

const { NotFound } = httpErrors;
export default class RoomController {
  static get inject() { return [RoomService, PageRenderer]; }

  constructor(roomService, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
  }

  registerApi(router) {
    router.post('/api/v1/rooms', [needsPermission(permissions.CREATE_ROOMS), validateBody(roomSchema)], async (req, res) => {
      const newRoom = await this.roomService.createRoom(req.body);
      return res.send(newRoom);
    });
  }

  registerPages(router) {
    router.get('/rooms/:roomId', [needsPermission(permissions.VIEW_ROOMS), validateParams(roomDetailsParamSchema)], async (req, res) => {
      const { roomId } = req.params;
      const roomDetails = await this.roomService.getRoomDetailsById(roomId);

      if (!roomDetails) {
        throw new NotFound();
      }

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { roomDetails });
    });
  }
}
