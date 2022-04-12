import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import requestHelper from '../utils/request-helper.js';
import ServerConfig from '../bootstrap/server-config.js';
import LessonService from '../services/lesson-service.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  postRoomBodySchema,
  getRoomParamsSchema,
  patchRoomBodySchema,
  patchRoomParamsSchema,
  deleteRoomParamsSchema,
  deleteRoomsQuerySchema,
  deleteRoomMemberParamsSchema,
  postRoomInvitationBodySchema,
  deleteRoomInvitationParamsSchema,
  postRoomInvitationConfirmBodySchema,
  getAuthorizeResourcesAccessParamsSchema,
  getRoomMembershipConfirmationParamsSchema
} from '../domain/schemas/room-schemas.js';

const jsonParser = express.json();
const { NotFound, Forbidden, Unauthorized, BadRequest } = httpErrors;

export default class RoomController {
  static get inject() { return [ServerConfig, RoomService, LessonService, UserService, StorageService, MailService, ClientDataMappingService, PageRenderer]; }

  constructor(serverConfig, roomService, lessonService, userService, storageService, mailService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.userService = userService;
    this.mailService = mailService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.lessonService = lessonService;
    this.storageService = storageService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRoomMembershipConfirmationPage(req, res) {
    const { user } = req;
    const { token } = req.params;

    if (!user) {
      throw new Unauthorized();
    }

    const { roomId, roomName, roomSlug, invalidInvitationReason } = await this.roomService.verifyInvitationToken({ token, user });
    const initialState = { token, roomId, roomName, roomSlug, invalidInvitationReason };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.roomMembershipConfirmation, initialState);
  }

  async handlePostRoom(req, res) {
    const { user } = req;
    const { name, slug, access, lessonsMode } = req.body;
    const newRoom = await this.roomService.createRoom({ name, slug, access, lessonsMode, user });

    return res.status(201).send(newRoom);
  }

  async handlePatchRoom(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { name, slug, lessonsMode, description } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    const updatedRoom = await this.roomService.updateRoom({ ...room, name, slug, lessonsMode, description });
    return res.status(201).send(updatedRoom);
  }

  async handleDeleteRoomsForUser(req, res) {
    const { ownerId, access } = req.query;

    const roomOwner = await this.userService.getUserById(ownerId);

    if (!roomOwner) {
      throw new BadRequest(`Unknown room owner with ID '${ownerId}'`);
    }

    const rooms = await this.roomService.getRoomsOwnedByUser(ownerId);
    const roomsToDelete = rooms.filter(room => !access || room.access === access);

    for (const room of roomsToDelete) {
      // eslint-disable-next-line no-await-in-loop
      await this._deleteRoom({ room, roomOwner });
    }

    return res.send({});
  }

  async handleDeleteOwnRoom(req, res) {
    const { user } = req;
    const { roomId } = req.params;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    await this._deleteRoom({ room, roomOwner: user });

    return res.send({});
  }

  async handleDeleteRoomMember(req, res) {
    const { user } = req;
    const { roomId, memberUserId } = req.params;

    const room = await this.roomService.getRoomById(roomId);
    const member = room?.members.find(m => m.userId === memberUserId);

    if (!room || !member) {
      throw new NotFound();
    }

    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    const updatedRoom = await this.roomService.removeRoomMember({ room, member });
    const mappedRoom = await this.clientDataMappingService.mapRoom(updatedRoom);

    return res.send({ room: mappedRoom });
  }

  async handleDeleteRoomInvitation(req, res) {
    const { user } = req;
    const { invitationId } = req.params;

    const invitation = await this.roomService.getRoomInvitationById(invitationId);
    if (!invitation) {
      throw new NotFound();
    }

    const room = await this.roomService.getRoomById(invitation.roomId);
    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    const remainingRoomInvitations = await this.roomService.deleteRoomInvitation({ room, invitation });
    const mappedInvitations = this.clientDataMappingService.mapRoomInvitations(remainingRoomInvitations);

    return res.send({ invitations: mappedInvitations });
  }

  async handlePostRoomInvitation(req, res) {
    const { user } = req;
    const { roomId, email } = req.body;
    const { room, owner, invitation } = await this.roomService.createOrUpdateInvitation({ roomId, email, user });

    const { origin } = requestHelper.getHostInfo(req);
    const invitationLink = urls.concatParts(origin, urls.getRoomMembershipConfirmationUrl(invitation.token));
    await this.mailService.sendRoomInvitationEmail({ roomName: room.name, ownerName: owner.username, email, invitationLink });

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
    const userId = req.user?._id;
    const routeWildcardValue = urls.removeLeadingSlash(req.params['0']);

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (room.slug !== routeWildcardValue) {
      return res.redirect(301, urls.getRoomUrl(room._id, room.slug));
    }

    const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
    if (isPrivateRoom && !userId) {
      throw new Unauthorized();
    }

    let invitations = [];

    if (isPrivateRoom) {
      const isRoomOwnerOrMember = await this.roomService.isRoomOwnerOrMember(roomId, userId);
      if (!isRoomOwnerOrMember) {
        throw new Forbidden();
      }
    }

    if (room.owner === userId) {
      invitations = await this.roomService.getRoomInvitations(roomId);
    }

    const lessonsMetadata = await this.lessonService.getLessonsMetadata(roomId);

    const mappedRoom = await this.clientDataMappingService.mapRoom(room);
    const mappedLessonMetadata = this.clientDataMappingService.mapLessonsMetadata(lessonsMetadata);
    const mappedInvitations = this.clientDataMappingService.mapRoomInvitations(invitations);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { room: mappedRoom, lessons: mappedLessonMetadata, invitations: mappedInvitations });
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

  async _deleteRoom({ room, roomOwner }) {
    await this.storageService.deleteRoomAndResources({ roomId: room._id, roomOwnerId: roomOwner._id });
    await this.mailService.sendRoomDeletionNotificationEmails({
      roomName: room.name,
      ownerName: roomOwner.username,
      roomMembers: room.members
    });
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

    router.patch(
      '/api/v1/rooms/:roomId',
      [needsPermission(permissions.OWN_ROOMS), jsonParser, validateParams(patchRoomParamsSchema), validateBody(patchRoomBodySchema)],
      (req, res) => this.handlePatchRoom(req, res)
    );

    router.delete(
      '/api/v1/rooms',
      [needsPermission(permissions.DELETE_FOREIGN_ROOMS), validateQuery(deleteRoomsQuerySchema)],
      (req, res) => this.handleDeleteRoomsForUser(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId',
      [needsPermission(permissions.OWN_ROOMS), validateParams(deleteRoomParamsSchema)],
      (req, res) => this.handleDeleteOwnRoom(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId/members/:memberUserId',
      [needsPermission(permissions.OWN_ROOMS), validateParams(deleteRoomMemberParamsSchema)],
      (req, res) => this.handleDeleteRoomMember(req, res)
    );

    router.post(
      '/api/v1/room-invitations',
      [needsPermission(permissions.OWN_ROOMS), jsonParser, validateBody(postRoomInvitationBodySchema)],
      (req, res) => this.handlePostRoomInvitation(req, res)
    );

    router.delete(
      '/api/v1/room-invitations/:invitationId',
      [needsPermission(permissions.OWN_ROOMS), validateParams(deleteRoomInvitationParamsSchema)],
      (req, res) => this.handleDeleteRoomInvitation(req, res)
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
      '/rooms/:roomId*',
      validateParams(getRoomParamsSchema),
      (req, res) => this.handleGetRoomPage(req, res)
    );

    router.get(
      '/room-membership-confirmation/:token',
      [needsPermission(permissions.JOIN_PRIVATE_ROOMS), validateParams(getRoomMembershipConfirmationParamsSchema)],
      (req, res) => this.handleGetRoomMembershipConfirmationPage(req, res)
    );
  }
}
