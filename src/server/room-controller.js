import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import MailService from '../services/mail-service.js';
import ClientDataMapper from './client-data-mapper.js';
import requestHelper from '../utils/request-helper.js';
import ServerConfig from '../bootstrap/server-config.js';
import { FEATURE_TOGGLES } from '../common/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { roomDetailsParamSchema, postRoomBodySchema, postRoomInvitationBodySchema, postRoomInvitationConfirmBodySchema, getRoomMembershipConfirmationParamsSchema } from '../domain/schemas/rooms-schemas.js';

const jsonParser = express.json();
const { NotFound } = httpErrors;

export default class RoomController {
  static get inject() { return [ServerConfig, RoomService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, roomService, mailService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.roomService = roomService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  async handleRoomMembershipConfirmationPage(req, res) {
    const { user } = req;
    const { token } = req.params;

    const { roomId, roomName, isValid } = await this.roomService.verifyInvitationToken({ token, user });
    const initialState = { token, roomId, roomName, isValid };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.roomMembershipConfirmation, initialState);
  }

  async handlePostRoom(req, res) {
    const { user } = req;
    const { name, access } = req.body;
    const newRoom = await this.roomService.createRoom({ name, access, user });
    res.status(201).send(newRoom);
  }

  async handlePostRoomInvitation(req, res) {
    const { user } = req;
    const { roomId, email } = req.body;
    const { room, owner, invitation } = await this.roomService.createOrUpdateInvitation({ roomId, email, user });

    const { origin } = requestHelper.getHostInfo(req);
    const invitationLink = urls.concatParts(origin, urls.getRoomMembershipConfirmationUrl(invitation.token));
    await this.mailService.sendRoomInvitation({ roomName: room.name, ownerName: owner.username, email, invitationLink });

    res.status(201).send(invitation);
  }

  async handlePostRoomInvitationConfirm(req, res) {
    const { user } = req;
    const { token } = req.body;
    await this.roomService.confirmInvitation({ token, user });

    res.status(201).end();
  }

  async handleGetRoomDetails(req, res) {
    const { roomId } = req.params;
    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    const roomDetails = await this.clientDataMapper.mapRoomDetails(room);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { roomDetails });
  }

  registerApi(router) {
    if (this.serverConfig.disabledFeatures.includes(FEATURE_TOGGLES.rooms)) {
      return;
    }

    router.post(
      '/api/v1/rooms',
      [needsPermission(permissions.CREATE_ROOMS), jsonParser, validateBody(postRoomBodySchema)],
      (req, res) => this.handlePostRoom(req, res)
    );

    router.post(
      '/api/v1/room-invitations',
      [needsPermission(permissions.CREATE_ROOMS), jsonParser, validateBody(postRoomInvitationBodySchema)],
      (req, res) => this.handlePostRoomInvitation(req, res)
    );

    router.post(
      '/api/v1/room-invitations/confirm',
      [needsPermission(permissions.CREATE_ROOMS), jsonParser, validateBody(postRoomInvitationConfirmBodySchema)],
      (req, res) => this.handlePostRoomInvitationConfirm(req, res)
    );
  }

  registerPages(router) {
    if (this.serverConfig.disabledFeatures.includes(FEATURE_TOGGLES.rooms)) {
      return;
    }

    router.get(
      '/rooms/:roomId',
      [needsPermission(permissions.VIEW_ROOMS), validateParams(roomDetailsParamSchema)],
      (req, res) => this.handleGetRoomDetails(req, res)
    );

    router.get(
      '/room-membership-confirmation/:token',
      [needsPermission(permissions.JOIN_PRIVATE_ROOMS), validateParams(getRoomMembershipConfirmationParamsSchema)],
      (req, res) => this.handleRoomMembershipConfirmationPage(req, res)
    );
  }
}
