import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import permissions from '../domain/permissions.js';
import { PAGE_NAME } from '../domain/page-name.js';
import RoomService from '../services/room-service.js';
import ClientDataMapper from './client-data-mapper.js';
import ServerConfig from '../bootstrap/server-config.js';
import LessonService from '../services/lesson-service.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import {
  getLessonParamsSchema,
  postLessonBodySchema,
  patchLessonParamsSchema,
  patchLessonBodySchema
} from '../domain/schemas/lesson-schemas.js';

const jsonParser = express.json();
const { NotFound, BadRequest, Forbidden } = httpErrors;

export default class LessonController {
  static get inject() { return [ServerConfig, LessonService, RoomService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, lessonService, roomService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.lessonService = lessonService;
    this.roomService = roomService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  async handleGetLessonPage(req, res) {
    const { user } = req;
    const { lessonId } = req.params;
    const routeWildcardValue = urls.removeLeadingSlash(req.params['0']);

    const lesson = await this.lessonService.getLessonById(lessonId);

    if (!lesson) {
      throw new NotFound();
    }

    if (lesson.slug !== routeWildcardValue) {
      return res.redirect(301, urls.getLessonUrl(lesson._id, lesson.slug));
    }

    const room = await this.roomService.getRoomById(lesson.roomId);
    const isPrivateRoom = room.access === ROOM_ACCESS_LEVEL.private;
    const isRoomOwnerOrMember = room.owner === user._id || room.members.find(member => member.userId === user._id);

    if (isPrivateRoom && !isRoomOwnerOrMember) {
      throw new Forbidden();
    }

    const mappedLesson = this.clientDataMapper.mapLesson(lesson);
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.lesson, { lesson: mappedLesson, roomOwner: room.owner });
  }

  async handlePostLesson(req, res) {
    const { user } = req;
    const { roomId, title, slug, language, schedule } = req.body;

    const room = await this.roomService.getRoomById(roomId);

    if (!room) {
      throw new BadRequest(`Unknown room id '${roomId}'`);
    }

    if (user._id !== room.owner) {
      throw new Forbidden();
    }

    const newLesson = await this.lessonService.createLesson({ user, roomId, title, slug, language, schedule });

    return res.status(201).send(newLesson);
  }

  async handlePatchLesson(req, res) {
    const { user } = req;
    const { lessonId } = req.params;
    const { title, slug, language, schedule } = req.body;

    const lesson = await this.lessonService.getLessonById(lessonId);

    if (!lesson) {
      throw new NotFound();
    }

    const room = await this.roomService.getRoomById(lesson.roomId);

    if (room.owner !== user._id) {
      throw new Forbidden();
    }

    const updatedLesson = await this.lessonService.updateLesson({ ...lesson, title, slug, language, schedule });
    return res.status(201).send(updatedLesson);
  }

  registerPages(router) {
    if (!this.serverConfig.areRoomsEnabled) {
      return;
    }

    router.get(
      '/lessons/:lessonId*',
      [validateParams(getLessonParamsSchema)],
      (req, res) => this.handleGetLessonPage(req, res)
    );

    router.post(
      '/api/v1/lessons',
      [needsPermission(permissions.OWN_LESSONS), jsonParser, validateBody(postLessonBodySchema)],
      (req, res) => this.handlePostLesson(req, res)
    );

    router.patch(
      '/api/v1/lessons/:lessonId',
      [needsPermission(permissions.OWN_LESSONS), jsonParser, validateParams(patchLessonParamsSchema), validateBody(patchLessonBodySchema)],
      (req, res) => this.handlePatchLesson(req, res)
    );
  }
}
