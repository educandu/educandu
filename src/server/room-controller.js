import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import StorageService from '../services/storage-service.js';
import DocumentService from '../services/document-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
import {
  NOT_ROOM_OWNER_ERROR_MESSAGE,
  NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE,
  NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE,
  ROOM_USER_ROLE
} from '../domain/constants.js';
import {
  postRoomBodySchema,
  getRoomParamsSchema,
  getRoomsQuerySchema,
  patchRoomParamsSchema,
  deleteRoomParamsSchema,
  deleteRoomsQuerySchema,
  getRoomWithSlugParamsSchema,
  patchRoomMetadataBodySchema,
  deleteRoomMemberParamsSchema,
  postRoomInvitationsBodySchema,
  patchRoomDocumentsBodySchema,
  deleteRoomInvitationParamsSchema,
  postRoomInvitationConfirmBodySchema,
  getAuthorizeResourcesAccessParamsSchema,
  getRoomMembershipConfirmationParamsSchema
} from '../domain/schemas/room-schemas.js';

const jsonParser = express.json();
const { NotFound, Forbidden, Unauthorized, BadRequest } = httpErrors;

export default class RoomController {
  static dependencies = [ServerConfig, RoomService, DocumentService, UserService, StorageService, MailService, ClientDataMappingService, PageRenderer];

  constructor(serverConfig, roomService, documentService, userService, storageService, mailService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.userService = userService;
    this.mailService = mailService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.storageService = storageService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRoomMembershipConfirmationPage(req, res) {
    const { user } = req;
    const { token } = req.params;

    const { roomId, roomName, roomSlug, invalidInvitationReason } = await this.roomService.verifyInvitationToken({ token, user });
    const initialState = { token, roomId, roomName, roomSlug, invalidInvitationReason };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.roomMembershipConfirmation, initialState);
  }

  async handleGetRooms(req, res) {
    const { user } = req;
    const { userRole } = req.query;

    let rooms;
    switch (userRole) {
      case ROOM_USER_ROLE.owner:
        rooms = await this.roomService.getRoomsOwnedByUser(user._id);
        break;
      case ROOM_USER_ROLE.ownerOrMember:
        rooms = await this.roomService.getRoomsOwnedOrJoinedByUser(user._id);
        break;
      case ROOM_USER_ROLE.ownerOrCollaborator:
        rooms = await this.roomService.getRoomsByOwnerOrCollaboratorUser(user._id);
        break;
      default:
        throw new BadRequest();
    }
    const mappedRooms = await Promise.all(rooms.map(room => this.clientDataMappingService.mapRoom({ room, viewingUser: user })));

    return res.send({ rooms: mappedRooms });
  }

  async handleGetRoom(req, res) {
    const { user } = req;
    const { roomId } = req.params;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE);
    }

    const mappedRoom = await this.clientDataMappingService.mapRoom({ room, viewingUser: user });

    return res.send({ room: mappedRoom });
  }

  async handlePostRoom(req, res) {
    const { user } = req;
    const { name, slug, documentsMode } = req.body;
    const newRoom = await this.roomService.createRoom({ name, slug, documentsMode, user });

    return res.status(201).send(newRoom);
  }

  async handlePatchRoomMetadata(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { name, slug, documentsMode, description } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (room.owner !== user._id) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.updateRoomMetadata(roomId, { name, slug, documentsMode, description });
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });

    return res.status(201).send({ room: mappedRoom });
  }

  async handlePatchRoomDocuments(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { documentIds } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (!isRoomOwnerOrInvitedCollaborator({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_OR_COLLABORATOR_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.updateRoomDocumentsOrder(roomId, documentIds);
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });

    return res.status(201).send({ room: mappedRoom });
  }

  async handleDeleteRoomsForUser(req, res) {
    const { ownerId } = req.query;

    const roomOwner = await this.userService.getUserById(ownerId);

    if (!roomOwner) {
      throw new BadRequest(`Unknown room owner with ID '${ownerId}'`);
    }

    const rooms = await this.roomService.getRoomsOwnedByUser(ownerId);

    for (const room of rooms) {
      await this._deleteRoom({ room, roomOwner });
    }

    await this.storageService.updateUserUsedBytes(ownerId);

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
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    await this._deleteRoom({ room, roomOwner: user });

    return res.send({});
  }

  async handleDeleteRoomMember(req, res) {
    const { user } = req;
    const { roomId, memberUserId } = req.params;

    const room = await this.roomService.getRoomById(roomId);
    const memberUser = await this.userService.getUserById(memberUserId);

    if (!room || !memberUser) {
      throw new NotFound();
    }

    if (room.owner !== user._id && memberUserId !== user._id) {
      throw new Forbidden(NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.removeRoomMember({ room, memberUserId });
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });
    if (memberUserId !== user._id) {
      await this.mailService.sendRoomMemberRemovalNotificationEmail({ roomName: room.name, ownerName: user.displayName, memberUser });
    }
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
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const remainingRoomInvitations = await this.roomService.deleteRoomInvitation({ room, invitation });
    const mappedInvitations = this.clientDataMappingService.mapRoomInvitations(remainingRoomInvitations);
    await this.mailService.sendRoomInvitationDeletionNotificationEmail({ roomName: room.name, ownerName: user.displayName, email: invitation.email });

    return res.send({ invitations: mappedInvitations });
  }

  async handlePostRoomInvitations(req, res) {
    const { user } = req;
    const { roomId, emails } = req.body;

    const { room, owner, invitations } = await this.roomService.createOrUpdateInvitations({ roomId, emails, user });
    await this.mailService.sendRoomInvitationEmails({ invitations, roomName: room.name, ownerName: owner.displayName });

    return res.status(201).send(invitations);
  }

  async handlePostRoomInvitationConfirm(req, res) {
    const { user } = req;
    const { token } = req.body;
    await this.roomService.confirmInvitation({ token, user });

    return res.status(201).end();
  }

  async handleGetRoomPage(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params['0']);

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (room.slug !== routeWildcardValue) {
      return res.redirect(301, routes.getRoomUrl(room._id, room.slug));
    }

    if (!user) {
      throw new Unauthorized();
    }

    let invitations = [];

    const isRoomOwnerOrMember = await this.roomService.isRoomOwnerOrMember(roomId, user._id);
    if (!isRoomOwnerOrMember) {
      throw new Forbidden(NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE);
    }

    const isRoomOwner = room.owner === user._id;
    if (isRoomOwner) {
      invitations = await this.roomService.getRoomInvitations(roomId);
    }

    const documentsMetadata = await this.documentService.getDocumentsExtendedMetadataByIds(room.documents);

    const mappedRoom = await this.clientDataMappingService.mapRoom({ room, viewingUser: user });
    const mappedDocumentsMetadata = await this.clientDataMappingService.mapDocsOrRevisions(documentsMetadata);
    const mappedInvitations = this.clientDataMappingService.mapRoomInvitations(invitations);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, { room: mappedRoom, documents: mappedDocumentsMetadata, invitations: mappedInvitations });
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
      ownerName: roomOwner.displayName,
      roomMembers: room.members
    });
  }

  registerApi(router) {
    router.get(
      '/api/v1/rooms',
      [needsPermission(permissions.CREATE_CONTENT), validateQuery(getRoomsQuerySchema)],
      (req, res) => this.handleGetRooms(req, res)
    );

    router.get(
      '/api/v1/rooms/:roomId',
      [needsPermission(permissions.CREATE_CONTENT), validateParams(getRoomParamsSchema)],
      (req, res) => this.handleGetRoom(req, res)
    );

    router.post(
      '/api/v1/rooms',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateBody(postRoomBodySchema)],
      (req, res) => this.handlePostRoom(req, res)
    );

    router.patch(
      '/api/v1/rooms/:roomId/metadata',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateParams(patchRoomParamsSchema), validateBody(patchRoomMetadataBodySchema)],
      (req, res) => this.handlePatchRoomMetadata(req, res)
    );

    router.patch(
      '/api/v1/rooms/:roomId/documents',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateParams(patchRoomParamsSchema), validateBody(patchRoomDocumentsBodySchema)],
      (req, res) => this.handlePatchRoomDocuments(req, res)
    );

    router.delete(
      '/api/v1/rooms',
      [needsPermission(permissions.DELETE_ANY_PRIVATE_CONTENT), validateQuery(deleteRoomsQuerySchema)],
      (req, res) => this.handleDeleteRoomsForUser(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId',
      [needsPermission(permissions.CREATE_CONTENT), validateParams(deleteRoomParamsSchema)],
      (req, res) => this.handleDeleteOwnRoom(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId/members/:memberUserId',
      [needsPermission(permissions.CREATE_CONTENT), validateParams(deleteRoomMemberParamsSchema)],
      (req, res) => this.handleDeleteRoomMember(req, res)
    );

    router.post(
      '/api/v1/room-invitations',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateBody(postRoomInvitationsBodySchema)],
      (req, res) => this.handlePostRoomInvitations(req, res)
    );

    router.delete(
      '/api/v1/room-invitations/:invitationId',
      [needsPermission(permissions.CREATE_CONTENT), validateParams(deleteRoomInvitationParamsSchema)],
      (req, res) => this.handleDeleteRoomInvitation(req, res)
    );

    router.post(
      '/api/v1/room-invitations/confirm',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateBody(postRoomInvitationConfirmBodySchema)],
      (req, res) => this.handlePostRoomInvitationConfirm(req, res)
    );

    router.get(
      '/api/v1/rooms/:roomId/authorize-resources-access',
      needsAuthentication(),
      validateParams(getAuthorizeResourcesAccessParamsSchema),
      (req, res) => this.handleAuthorizeResourcesAccess(req, res)
    );
  }

  registerPages(router) {
    router.get(
      '/rooms/:roomId*',
      validateParams(getRoomWithSlugParamsSchema),
      (req, res) => this.handleGetRoomPage(req, res)
    );

    router.get(
      '/room-membership-confirmation/:token',
      needsAuthentication(),
      validateParams(getRoomMembershipConfirmationParamsSchema),
      (req, res) => this.handleGetRoomMembershipConfirmationPage(req, res)
    );
  }
}
