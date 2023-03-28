import os from 'node:os';
import multer from 'multer';
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
import DocumentService from '../services/document-service.js';
import { getRoomMediaRoomPath } from '../utils/storage-utils.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import uploadLimitExceededMiddleware from '../domain/upload-limit-exceeded-middleware.js';
import { validateBody, validateFile, validateParams, validateQuery } from '../domain/validation-middleware.js';
import { isRoomOwner, isRoomOwnerOrInvitedCollaborator, isRoomOwnerOrInvitedMember } from '../utils/room-utils.js';
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
  postRoomMessageBodySchema,
  getRoomWithSlugParamsSchema,
  patchRoomMetadataBodySchema,
  deleteRoomMemberParamsSchema,
  patchRoomDocumentsBodySchema,
  postRoomInvitationsBodySchema,
  deleteRoomMessageParamsSchema,
  deleteRoomInvitationParamsSchema,
  postRoomInvitationConfirmBodySchema,
  getAuthorizeResourcesAccessParamsSchema,
  getRoomMembershipConfirmationParamsSchema,
  deleteRoomMediaParamsSchema,
  getAllRoomMediaParamsSchema,
  postRoomMediaParamsSchema,
  patchRoomContentBodySchema
} from '../domain/schemas/room-schemas.js';

const jsonParser = express.json();
const multipartParser = multer({ dest: os.tmpdir() });

const { NotFound, Forbidden, BadRequest } = httpErrors;

export default class RoomController {
  static dependencies = [ServerConfig, RoomService, DocumentService, UserService, MailService, ClientDataMappingService, PageRenderer];

  constructor(serverConfig, roomService, documentService, userService, mailService, clientDataMappingService, pageRenderer) {
    this.roomService = roomService;
    this.userService = userService;
    this.mailService = mailService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
  }

  async handleGetRoomMediaOverview(req, res) {
    const { user } = req;
    const roomMediaOverview = await this.roomService.getRoomMediaOverview({ user });
    return res.send(roomMediaOverview);
  }

  async handleGetAllRoomMedia(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const roomMedia = await this.roomService.getAllRoomMedia({ user, roomId });
    return res.send(roomMedia);
  }

  async handlePostRoomMedia(req, res) {
    const { user, file } = req;
    const { roomId } = req.params;
    const roomMedia = await this.roomService.createRoomMedia({ user, roomId, file });
    return res.status(201).send(roomMedia);
  }

  async handleDeleteRoomMedia(req, res) {
    const { user } = req;
    const { roomId, name } = req.params;
    const roomMedia = await this.roomService.deleteRoomMedia({ user, roomId, name });
    return res.send(roomMedia);
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
    const { name, slug, isCollaborative, shortDescription } = req.body;
    const newRoom = await this.roomService.createRoom({ name, slug, isCollaborative, shortDescription, user });

    return res.status(201).send(newRoom);
  }

  async handlePatchRoomMetadata(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { name, slug, isCollaborative, shortDescription } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (!isRoomOwner({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.updateRoomMetadata(roomId, { name, slug, isCollaborative, shortDescription });
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });

    return res.status(201).send({ room: mappedRoom });
  }

  async handlePatchRoomContent(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { overview } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new NotFound();
    }

    if (!isRoomOwner({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.updateRoomContent(roomId, { overview });
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
      throw new NotFound(`Unknown room owner with ID '${ownerId}'`);
    }

    const rooms = await this.roomService.getRoomsOwnedByUser(ownerId);

    for (const room of rooms) {
      await this._deleteRoomAndNotify({ room, roomOwner });
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

    if (!isRoomOwner({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    await this._deleteRoomAndNotify({ room, roomOwner: user });

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
    if (!isRoomOwner({ room, userId: user._id })) {
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

  async handlePostRoomMessage(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const { text, emailNotification } = req.body;

    const room = await this.roomService.getRoomById(roomId);
    if (!isRoomOwner({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.createRoomMessage({ room, text, emailNotification });
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });

    if (emailNotification) {
      await this.mailService.sendRoomMessageEmailsToMembers({ room });
    }

    return res.status(201).send({ room: mappedRoom });
  }

  async handleDeleteRoomMessage(req, res) {
    const { user } = req;
    const { roomId, messageKey } = req.params;

    const room = await this.roomService.getRoomById(roomId);
    if (!isRoomOwner({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_ERROR_MESSAGE);
    }

    const updatedRoom = await this.roomService.deleteRoomMessage({ room, messageKey });
    const mappedRoom = await this.clientDataMappingService.mapRoom({ room: updatedRoom, viewingUser: user });

    return res.send({ room: mappedRoom });
  }

  async handleGetRoomPage(req, res) {
    const { user } = req;
    const { roomId } = req.params;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params['0']);

    const room = await this.roomService.getRoomById(roomId);
    if (!room) {
      throw new NotFound();
    }

    if (!isRoomOwnerOrInvitedMember({ room, userId: user._id })) {
      throw new Forbidden(NOT_ROOM_OWNER_OR_MEMBER_ERROR_MESSAGE);
    }

    if (room.slug !== routeWildcardValue) {
      return res.redirect(301, routes.getRoomUrl(room._id, room.slug));
    }

    const invitations = isRoomOwner({ room, userId: user._id })
      ? await this.roomService.getRoomInvitations(roomId)
      : [];

    const { storagePlan, usedBytes } = await this.roomService.getAllRoomMedia({ user, roomId });
    const roomMediaContext = storagePlan || usedBytes
      ? {
        roomId: room._id,
        path: getRoomMediaRoomPath(room._id),
        usedBytes: usedBytes || 0,
        maxBytes: storagePlan?.maxBytes || 0,
        isDeletionEnabled: isRoomOwner({ room: room || null, userId: user._id })
      }
      : null;

    const documentsMetadata = await this.documentService.getDocumentsExtendedMetadataByIds(room.documents);

    const mappedRoom = await this.clientDataMappingService.mapRoom({ room, viewingUser: user });
    const mappedDocumentsMetadata = await this.clientDataMappingService.mapDocsOrRevisions(documentsMetadata);
    const mappedInvitations = this.clientDataMappingService.mapRoomInvitations(invitations);

    const initialState = { room: mappedRoom, documents: mappedDocumentsMetadata, invitations: mappedInvitations, roomMediaContext };

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.room, initialState);
  }

  async handleAuthorizeResourcesAccess(req, res) {
    const { roomId } = req.params;

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).end();
    }

    const room = await this.roomService.getRoomById(roomId);
    if (!room || !isRoomOwnerOrInvitedMember({ room, userId })) {
      return res.status(403).end();
    }

    return res.status(200).end();
  }

  async _deleteRoomAndNotify({ room, roomOwner }) {
    await this.roomService.deleteRoom({ room, roomOwner });
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
      '/api/v1/rooms/:roomId/content',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateParams(patchRoomParamsSchema), validateBody(patchRoomContentBodySchema)],
      (req, res) => this.handlePatchRoomContent(req, res)
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

    router.get(
      '/api/v1/room-media-overview',
      needsPermission(permissions.BROWSE_STORAGE),
      (req, res) => this.handleGetRoomMediaOverview(req, res)
    );

    router.get(
      '/api/v1/room-media/:roomId',
      needsPermission(permissions.BROWSE_STORAGE),
      validateParams(getAllRoomMediaParamsSchema),
      (req, res) => this.handleGetAllRoomMedia(req, res)
    );

    router.post(
      '/api/v1/room-media/:roomId',
      needsPermission(permissions.CREATE_CONTENT),
      uploadLimitExceededMiddleware(),
      multipartParser.single('file'),
      validateFile('file'),
      validateParams(postRoomMediaParamsSchema),
      (req, res) => this.handlePostRoomMedia(req, res)
    );

    router.delete(
      '/api/v1/room-media/:roomId/:name',
      needsPermission(permissions.DELETE_OWN_PRIVATE_CONTENT),
      validateParams(deleteRoomMediaParamsSchema),
      (req, res) => this.handleDeleteRoomMedia(req, res)
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

    router.post(
      '/api/v1/rooms/:roomId/messages',
      [needsPermission(permissions.CREATE_CONTENT), jsonParser, validateBody(postRoomMessageBodySchema)],
      (req, res) => this.handlePostRoomMessage(req, res)
    );

    router.delete(
      '/api/v1/rooms/:roomId/messages/:messageKey',
      [needsPermission(permissions.CREATE_CONTENT), validateParams(deleteRoomMessageParamsSchema)],
      (req, res) => this.handleDeleteRoomMessage(req, res)
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
      needsAuthentication(),
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
