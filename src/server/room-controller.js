import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { roomDetailsParamSchema, roomSchema } from '../domain/schemas/rooms-schemas.js';
import ClientDataMapper from './client-data-mapper.js';

const { NotFound } = httpErrors;
export default class RoomController {
  static get inject() { return [RoomService, ClientDataMapper, PageRenderer]; }

  constructor(roomService, clientDataMapper, pageRenderer) {
    this.roomService = roomService;
    this.pageRenderer = pageRenderer;
    this.clientDataMapper = clientDataMapper;
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
      const room = await this.roomService.getRoomById(roomId);

      if (!room) {
        throw new NotFound();
      }

      const roomDetails = await this.clientDataMapper.mapRoomDetails(room);

      return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { roomDetails });
    });
  }
}
