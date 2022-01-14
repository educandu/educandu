import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import LessonController from './lesson-controller.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

describe('lesson-controller', () => {
  const sandbox = sinon.createSandbox();

  let lessonService;
  let serverConfig;
  let pageRenderer;
  let roomService;

  let lessonId;
  let roomId;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    serverConfig = {
      areRoomsEnabled: true
    };
    lessonService = {
      getLesson: sandbox.stub(),
      createLesson: sandbox.stub()
    };
    roomService = {
      getRoomById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub()
    };
    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    lessonId = uniqueId.create();
    roomId = uniqueId.create();
    res = {};

    sut = new LessonController(serverConfig, lessonService, roomService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetLessonPage', () => {
    let room;
    let lesson;

    describe('when the lesson does not exist', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', lessonId: uniqueId.create() } };

        lessonService.getLesson.withArgs(lessonId).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetLessonPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the lesson slug is different than the URL slug', () => {
      beforeEach(done => {
        req = { user, params: { 0: '/url-slug', lessonId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        lesson = { _id: lessonId, slug: 'lesson-slug' };

        lessonService.getLesson.withArgs(lessonId).resolves(lesson);

        sut.handleGetLessonPage(req, res);
      });

      it('should redirect to the correct lesson url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl()).toBe(`/lessons/${lessonId}/lesson-slug`);
      });
    });

    describe('when the user is neither owner nor member of the private room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: uniqueId.create(), members: [] };

        lessonService.getLesson.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleGetLessonPage(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is owner of the private room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: user._id, members: [] };

        lessonService.getLesson.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson });
      });
    });

    describe('when the user is member of the private room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: uniqueId.create(), members: [{ userId: user._id }] };

        lessonService.getLesson.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson });
      });
    });

    describe('when the room containing the lesson is public', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.public, owner: uniqueId.create(), members: [] };

        lessonService.getLesson.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson });
      });
    });
  });

  describe('handlePostLesson', () => {
    let room;
    let lesson;

    describe('when the roomId is unknown', () => {
      beforeEach(() => {
        req = { user, body: { roomId } };
        room = null;

        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw BadRequest', async () => {
        await expect(sut.handlePostLesson(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when the room to contain the lesson is not owned by the user', () => {
      beforeEach(() => {
        req = { user, body: { roomId } };
        room = { _id: roomId, owner: uniqueId.create() };

        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostLesson(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room to contain the lesson is owned by the user', () => {
      let newLesson;

      beforeEach(done => {
        room = { _id: roomId, owner: user._id };
        lesson = { roomId, title: 'title', slug: 'slug', language: 'language', schedule: {} };
        newLesson = { _id: lessonId, ...lesson };

        req = { user, body: lesson };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        roomService.getRoomById.withArgs(roomId).resolves(room);
        lessonService.createLesson.resolves(newLesson);

        sut.handlePostLesson(req, res);
      });

      it('should create the lesson', () => {
        sinon.assert.calledWith(lessonService.createLesson, { user, ...lesson });
      });

      it('should return the lesson', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(newLesson);
      });
    });
  });

});
