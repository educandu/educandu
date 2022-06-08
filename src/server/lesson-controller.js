import express from 'express';
import httpErrors from 'http-errors';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import LessonService from '../services/lesson-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE } from '../domain/constants.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams, validateQuery } from '../domain/validation-middleware.js';
import {
  getLessonParamsSchema,
  postLessonBodySchema,
  patchLessonParamsSchema,
  deleteLessonParamsSchema,
  patchLessonMetadataBodySchema,
  patchLessonSectionsBodySchema,
  getLessonQuerySchema
} from '../domain/schemas/lesson-schemas.js';

const jsonParser = express.json();
const { NotFound, BadRequest, Forbidden, Unauthorized } = httpErrors;

const isRoomOwnerOrCollaborator = ({ room, userId }) => {
  const isOwner = room.owner === userId;
  const isCollaborator = room.lessonsMode === ROOM_LESSONS_MODE.collaborative && room.members.some(m => m.userId === userId);
  return isOwner || isCollaborator;
};

class LessonController {
  static get inject() { return [ServerConfig, LessonService, RoomService, ClientDataMappingService, PageRenderer]; }

  constructor(serverConfig, lessonService, roomService, clientDataMappingService, pageRenderer) {
    this.serverConfig = serverConfig;
    this.lessonService = lessonService;
    this.roomService = roomService;
    this.clientDataMappingService = clientDataMappingService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetLessonPage(req, res) {
    const { user } = req;
    const { lessonId } = req.params;
    const { view, templateLessonId } = req.query;
    const routeWildcardValue = urlUtils.removeLeadingSlashes(req.params['0']);

    const lesson = await this.lessonService.getLessonById(lessonId);
    const templateLesson = templateLessonId ? await this.lessonService.getLessonById(templateLessonId) : null;

    if (!lesson || (templateLessonId && !templateLesson)) {
      throw new NotFound();
    }

    if (templateLesson && lesson.roomId !== templateLesson.roomId) {
      throw new BadRequest();
    }

    if (lesson.slug !== routeWildcardValue) {
      return res.redirect(301, routes.getLessonUrl({ id: lesson._id, slug: lesson.slug, view, templateLessonId }));
    }

    const room = await this.roomService.getRoomById(lesson.roomId);
    const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
    const isRoomOwnerOrMember = user && (room.owner === user._id || room.members.some(member => member.userId === user._id));

    if (isPrivateRoom && !user) {
      throw new Unauthorized();
    }

    if (isPrivateRoom && !isRoomOwnerOrMember) {
      throw new Forbidden();
    }

    const mappedLesson = this.clientDataMappingService.mapLesson(lesson);
    const mappedTemplateLesson = templateLesson ? this.clientDataMappingService.mapLesson(templateLesson) : null;
    const templateSections = mappedTemplateLesson ? this.clientDataMappingService.createProposedLessonSections(mappedTemplateLesson) : [];
    const mappedRoom = await this.clientDataMappingService.mapRoom(room, user);

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.lesson, { lesson: mappedLesson, room: mappedRoom, templateSections });
  }

  async handlePostLesson(req, res) {
    const { user } = req;
    const { roomId, title, slug, language, schedule } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new BadRequest(`Unknown room id '${roomId}'`);
    }

    if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
      throw new Forbidden();
    }

    const newLesson = await this.lessonService.createLesson({ userId: user._id, roomId, title, slug, language, schedule });

    return res.status(201).send(newLesson);
  }

  async handlePatchLessonMetadata(req, res) {
    const { user } = req;
    const { lessonId } = req.params;
    const { title, slug, language, schedule } = req.body;

    await this._authorizeLessonWriteAccess(req);

    const updatedLesson = await this.lessonService.updateLessonMetadata(
      lessonId,
      { userId: user._id, title, slug, language, schedule }
    );
    return res.status(201).send(updatedLesson);
  }

  async handlePatchLessonSections(req, res) {
    const { user } = req;
    const { lessonId } = req.params;
    const { sections } = req.body;

    await this._authorizeLessonWriteAccess(req);

    const updatedLesson = await this.lessonService.updateLessonSections(lessonId, { userId: user._id, sections });
    return res.status(201).send(updatedLesson);
  }

  async handleDeleteLesson(req, res) {
    const { user } = req;
    const { lessonId } = req.params;

    const lesson = await this.lessonService.getLessonById(lessonId);

    if (!lesson) {
      throw new NotFound();
    }

    const room = await this.roomService.getRoomById(lesson.roomId);

    if (!room) {
      throw new NotFound(`Unknown room id '${lesson.roomId}'`);
    }

    if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
      throw new Forbidden();
    }

    await this.lessonService.deleteLessonById(lessonId);

    return res.send({});
  }

  async _authorizeLessonWriteAccess(req) {
    const { user } = req;
    const { lessonId } = req.params;

    const lesson = await this.lessonService.getLessonById(lessonId);

    if (!lesson) {
      throw new NotFound();
    }

    const room = await this.roomService.getRoomById(lesson.roomId);

    if (!isRoomOwnerOrCollaborator({ room, userId: user._id })) {
      throw new Forbidden();
    }
  }

  registerApi(router) {
    if (!this.serverConfig.areRoomsEnabled) {
      return;
    }

    router.post(
      '/api/v1/lessons',
      [needsPermission(permissions.OWN_LESSONS), jsonParser, validateBody(postLessonBodySchema)],
      (req, res) => this.handlePostLesson(req, res)
    );

    router.patch(
      '/api/v1/lessons/:lessonId/metadata',
      [needsPermission(permissions.OWN_LESSONS), jsonParser, validateParams(patchLessonParamsSchema), validateBody(patchLessonMetadataBodySchema)],
      (req, res) => this.handlePatchLessonMetadata(req, res)
    );

    router.patch(
      '/api/v1/lessons/:lessonId/sections',
      [needsPermission(permissions.OWN_LESSONS), jsonParser, validateParams(patchLessonParamsSchema), validateBody(patchLessonSectionsBodySchema)],
      (req, res) => this.handlePatchLessonSections(req, res)
    );

    router.delete(
      '/api/v1/lessons/:lessonId',
      [needsPermission(permissions.OWN_LESSONS), validateParams(deleteLessonParamsSchema)],
      (req, res) => this.handleDeleteLesson(req, res)
    );
  }

  registerPages(router) {
    if (!this.serverConfig.areRoomsEnabled) {
      return;
    }

    router.get(
      '/lessons/:lessonId*',
      validateParams(getLessonParamsSchema),
      validateQuery(getLessonQuerySchema),
      (req, res) => this.handleGetLessonPage(req, res)
    );
  }

}

export default LessonController;
