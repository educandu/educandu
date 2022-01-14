import express from 'express';
import urls from '../utils/urls.js';
import httpErrors from 'http-errors';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
import ServerConfig from '../bootstrap/server-config.js';
import LessonService from '../services/lesson-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { getLessonParamsSchema, postLessonBodySchema } from '../domain/schemas/lesson-schemas.js';

const jsonParser = express.json();
const { NotFound } = httpErrors;

export default class LessonController {
  static get inject() { return [ServerConfig, LessonService, PageRenderer]; }

  constructor(serverConfig, lessonService, pageRenderer) {
    this.serverConfig = serverConfig;
    this.lessonService = lessonService;
    this.pageRenderer = pageRenderer;
  }

  async handleGetLessonPage(req, res) {
    const { lessonId } = req.params;
    const routeWildcardValue = urls.removeLeadingSlash(req.params[0]);

    const lesson = await this.lessonService.getLesson(lessonId);

    if (!lesson) {
      throw new NotFound();
    }

    if (lesson.slug !== routeWildcardValue) {
      return res.redirect(301, urls.getLessonUrl(lesson._id, lesson.slug));
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.lesson, { lesson });
  }

  async handlePostLesson(req, res) {
    const { user } = req;
    const { roomId, title, slug, language, schedule } = req.body;
    const newLesson = await this.lessonService.createLesson({ user, roomId, title, slug, language, schedule });

    return res.status(201).send(newLesson);
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
      [jsonParser, validateBody(postLessonBodySchema)],
      (req, res) => this.handlePostLesson(req, res)
    );

  }
}
