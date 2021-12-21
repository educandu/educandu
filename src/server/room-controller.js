import express from 'express';
import urls from '../utils/urls.js';
import permissions from '../domain/permissions.js';
import RoomService from '../services/room-service.js';
import MailService from '../services/mail-service.js';
import requestHelper from '../utils/request-helper.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { postRoomBodySchema, postRoomInvitationBodySchema } from '../domain/schemas/rooms-schemas.js';

const jsonParser = express.json();

export default class RoomController {
  static get inject() { return [RoomService, MailService]; }

  constructor(roomService, mailService) {
    this.roomService = roomService;
    this.mailService = mailService;
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
    const invitationLink = urls.concatParts(origin, urls.getConfirmRoomMembershipUrl(invitation.token));
    await this.mailService.sendRoomInvitation({ roomName: room.name, ownerName: owner.username, email, invitationLink });

    res.status(201).send(invitation);
  }

  registerApi(router) {
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
  }
}
