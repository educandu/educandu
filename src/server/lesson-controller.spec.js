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

  let clientDataMapper;
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
      getLessonById: sandbox.stub(),
      createLesson: sandbox.stub(),
      updateLessonMetadata: sandbox.stub()
    };
    roomService = {
      getRoomById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub()
    };
    clientDataMapper = {
      mapLesson: sandbox.stub()
    };
    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    lessonId = uniqueId.create();
    roomId = uniqueId.create();
    res = {};

    sut = new LessonController(serverConfig, lessonService, roomService, clientDataMapper, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetLessonPage', () => {
    let room;
    let lesson;
    let mappedLesson;

    describe('when user is not provided (session expired)', () => {
      beforeEach(done => {
        req = {
          params: { 0: '', lessonId },
          path: `/lessons/${lessonId}`
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handleGetLessonPage(req, res);
      });

      it('should redirect to the login page with keeping the lesson page referrence', () => {
        expect(res.statusCode).toBe(302);
        expect(res._getRedirectUrl()).toBe(`/login?redirect=%2Flessons%2F${lessonId}`);
      });
    });

    describe('when the lesson does not exist', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', lessonId: uniqueId.create() } };

        lessonService.getLessonById.withArgs(lessonId).resolves(null);
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

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);

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

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
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
        mappedLesson = { ...lesson };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMapper.mapLesson.withArgs(lesson).returns(mappedLesson);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson: mappedLesson, roomOwner: room.owner });
      });
    });

    describe('when the user is member of the private room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: uniqueId.create(), members: [{ userId: user._id }] };
        mappedLesson = { ...lesson };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMapper.mapLesson.withArgs(lesson).returns(mappedLesson);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson, roomOwner: room.owner });
      });
    });

    describe('when the room containing the lesson is public', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.public, owner: uniqueId.create(), members: [] };
        mappedLesson = { ...lesson };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMapper.mapLesson.withArgs(lesson).returns(mappedLesson);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson: mappedLesson, roomOwner: room.owner });
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

  describe('handlePatchLessonMetadata', () => {

    describe('when the request data is valid', () => {
      let room;
      let lesson;
      let requestBody;
      let updatedLesson;

      beforeEach(done => {
        room = { _id: uniqueId.create(), owner: user._id };
        lesson = {
          _id: uniqueId.create(),
          roomId: room._id,
          title: 'title',
          slug: 'slug',
          language: 'language',
          schedule: {
            startsOn: new Date().toISOString()
          }
        };
        requestBody = {
          title: 'new title',
          slug: 'new-slug',
          language: 'new language',
          schedule: { startsOn: new Date().toISOString() }
        };
        updatedLesson = {
          ...lesson,
          ...requestBody
        };

        lessonService.getLessonById.withArgs(lesson._id).resolves(lesson);
        roomService.getRoomById.withArgs(room._id).resolves(room);
        lessonService.updateLessonMetadata.resolves(updatedLesson);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { lessonId: lesson._id },
          body: { ...requestBody }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePatchLessonMetadata(req, res);
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call lessonService.updateLessonMetadata', () => {
        sinon.assert.calledWith(lessonService.updateLessonMetadata, lesson._id, { ...requestBody });
      });

      it('should respond with the updated lesson', () => {
        expect(res._getData()).toEqual(updatedLesson);
      });
    });

    describe('when the request contains an unknown lesson id', () => {
      beforeEach(() => {
        lessonService.getLessonById.withArgs(lessonId).resolves(null);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { lessonId },
          body: { title: 'new title', slug: 'new-slug', language: 'new language' }
        });
        req.user = user;

        res = {};
      });

      it('should throw NotFound', () => {
        expect(() => sut.handlePatchLessonMetadata(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request is made by a user which is not the lesson\'s room owner', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create()
        };
        const lesson = {
          _id: uniqueId.create(),
          roomId: room._id
        };

        lessonService.getLessonById.withArgs(lesson._id).resolves(lesson);
        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { lessonId: lesson._id },
          body: { title: 'new title', slug: 'new-slug', language: 'new language' }

        });
        req.user = user;

        res = {};
      });

      it('should throw Forbidden', () => {
        expect(() => sut.handlePatchLessonMetadata(req, res)).rejects.toThrow(Forbidden);
      });
    });
  });

});
