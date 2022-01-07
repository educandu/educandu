import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import UserService from '../services/user-service.js';
import RoomService from '../services/room-service.js';
import MailService from '../services/mail-service.js';
import ClientDataMapper from './client-data-mapper.js';
import requestHelper from '../utils/request-helper.js';
import ServerConfig from '../bootstrap/server-config.js';
import LessonService from '../services/lesson-service.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  postRoomBodySchema,
  getRoomParamsSchema,
  deleteRoomParamsSchema,
  postRoomInvitationBodySchema,
  postRoomInvitationConfirmBodySchema,
  getAuthorizeResourcesAccessParamsSchema,
  getRoomMembershipConfirmationParamsSchema
} from '../domain/schemas/rooms-schemas.js';

const jsonParser = express.json();
const { NotFound, Forbidden } = httpErrors;

export default class RoomController {
  static get inject() { return [ServerConfig, RoomService, UserService, LessonService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, roomService, userService, lessonService, mailService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.roomService = roomService;
    this.userService = userService;
    this.lessonService = lessonService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  async handleGetRoomMembershipConfirmationPage(req, res) {
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

    return res.status(201).send(newRoom);
  }

  async handleDeleteRoom(req, res) {
    const { user } = req;
    const { roomId } = req.params;

    const { members, name: roomName } = await this.roomService.deleteRoom(roomId, user);

    const userIds = members.map(({ userId }) => userId);

    const users = await this.userService.getUsersByIds(userIds);

    await Promise.all(users.map(({ email }) => {
      return this.mailService.sendRoomDeletionNotification({ email, roomName, ownerName: user.username });
    }));

    return res.status(200).end();
  }

  async handlePostRoomInvitation(req, res) {
    const { user } = req;
    const { roomId, email } = req.body;
    const { room, owner, invitation } = await this.roomService.createOrUpdateInvitation({ roomId, email, user });

    const { origin } = requestHelper.getHostInfo(req);
    const invitationLink = urls.concatParts(origin, urls.getRoomMembershipConfirmationUrl(invitation.token));
    await this.mailService.sendRoomInvitation({ roomName: room.name, ownerName: owner.username, email, invitationLink });

    return res.status(201).send(invitation);
  }

  async handlePostRoomInvitationConfirm(req, res) {
    const { user } = req;
    const { token } = req.body;
    await this.roomService.confirmInvitation({ token, user });

    return res.status(201).end();
  }

  async handleGetRoomPage(req, res) {
    const { roomId } = req.params;
    const { _id: userId } = req.user;
    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
    let invitations = [];

    if (isPrivateRoom) {
      const isRoomOwnerOrMember = await this.roomService.isRoomOwnerOrMember(roomId, userId);
      if (!isRoomOwnerOrMember) {
        throw new Forbidden();
      }

      if (room.owner === userId) {
        invitations = await this.roomService.getRoomInvitations(roomId);
      }
    }

    const mappedRoom = await this.clientDataMapper.mapRoom(room);
    const lessons = await this.lessonService.getLessons(roomId);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { room: mappedRoom, invitations, lessons });
  }

  async handleAuthorizeResourcesAccess(req, res) {
    const { roomId } = req.params;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).end();
    }

    const result = await this.roomService.isRoomOwnerOrMember(roomId, userId);
    if (!result) {
      return res.status(403).end();
    }

    return res.status(200).end();
  }

  registerApi(router) {
    if (!this.serverConfig.areRoomsEnabled) {
      return;
    }

    router.post(
      '/api/v1/rooms',
      [needsPermission(permissions.OWN_ROOMS), jsonParser, validateBody(postRoomBodySchema)],
      (req, res) => this.handlePostRoom(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId',
      [needsPermission(permissions.OWN_ROOMS), validateParams(deleteRoomParamsSchema)],
      (req, res) => this.handleDeleteRoom(req, res)
    );

    router.post(
      '/api/v1/room-invitations',
      [needsPermission(permissions.OWN_ROOMS), jsonParser, validateBody(postRoomInvitationBodySchema)],
      (req, res) => this.handlePostRoomInvitation(req, res)
    );

    router.post(
      '/api/v1/room-invitations/confirm',
      [needsPermission(permissions.OWN_ROOMS), jsonParser, validateBody(postRoomInvitationConfirmBodySchema)],
      (req, res) => this.handlePostRoomInvitationConfirm(req, res)
    );

    router.get(
      '/api/v1/rooms/:roomId/authorize-resources-access',
      [needsPermission(permissions.AUTORIZE_ROOMS_RESOURCES), validateParams(getAuthorizeResourcesAccessParamsSchema)],
      (req, res) => this.handleAuthorizeResourcesAccess(req, res)
    );
  }

  registerPages(router) {
    if (!this.serverConfig.areRoomsEnabled) {
      return;
    }

    router.get(
      '/rooms/:roomId',
      [needsPermission(permissions.OWN_ROOMS), validateParams(getRoomParamsSchema)],
      (req, res) => this.handleGetRoomPage(req, res)
    );

    router.get(
      '/room-membership-confirmation/:token',
      [needsPermission(permissions.JOIN_PRIVATE_ROOMS), validateParams(getRoomMembershipConfirmationParamsSchema)],
      (req, res) => this.handleGetRoomMembershipConfirmationPage(req, res)
    );
  }
}
