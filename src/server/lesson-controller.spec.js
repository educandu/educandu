/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import LessonController from './lesson-controller.js';
import { ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE } from '../domain/constants.js';

const { NotFound, Forbidden, BadRequest, Unauthorized } = httpErrors;

describe('lesson-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
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
      updateLessonMetadata: sandbox.stub(),
      deleteLessonById: sandbox.stub()
    };
    roomService = {
      getRoomById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub()
    };
    clientDataMappingService = {
      mapLesson: sandbox.stub(),
      mapRoom: sandbox.stub(),
      createProposedLessonSections: sandbox.stub()
    };
    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    lessonId = uniqueId.create();
    roomId = uniqueId.create();
    res = {};

    sut = new LessonController(serverConfig, lessonService, roomService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetLessonPage', () => {
    let room;
    let lesson;
    let mappedLesson;
    let mappedRoom;

    describe('when user is not provided (session expired)', () => {
      beforeEach(() => {
        req = { params: { 0: '', lessonId }, query: {} };
        room = { _id: roomId, access: ROOM_ACCESS_LEVEL.private, owner: uniqueId.create(), members: [] };
        lesson = { _id: lessonId, slug: '', roomId };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleGetLessonPage(req, {})).rejects.toThrow(Unauthorized);
      });
    });

    describe('when the lesson does not exist', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', lessonId: uniqueId.create() }, query: {} };

        lessonService.getLessonById.withArgs(lessonId).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetLessonPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the lesson slug is different than the URL slug', () => {
      beforeEach(done => {
        req = { user, params: { 0: '/url-slug', lessonId }, query: {} };
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
        req = { user, params: { 0: '/slug', lessonId }, query: {} };
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
        req = { user, params: { 0: '/slug', lessonId }, query: {} };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: user._id, members: [] };
        mappedLesson = { ...lesson };
        mappedRoom = { ...room, owner: { _id: room.owner } };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapLesson.withArgs(lesson).returns(mappedLesson);
        clientDataMappingService.mapRoom.withArgs(room, user).resolves(mappedRoom);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson: mappedLesson, room: mappedRoom, templateSections: [] });
      });
    });

    describe('when the user is member of the private room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId }, query: {} };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.private, owner: uniqueId.create(), members: [{ userId: user._id }] };
        mappedLesson = { ...lesson };
        mappedRoom = { ...room, owner: { _id: room.owner } };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapLesson.withArgs(lesson).returns(mappedLesson);
        clientDataMappingService.mapRoom.withArgs(room, user).resolves(mappedRoom);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson: mappedLesson, room: mappedRoom, templateSections: [] });
      });
    });

    describe('when the room containing the lesson is public', () => {
      beforeEach(() => {
        req = { user, params: { 0: '/slug', lessonId }, query: {} };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.public, owner: uniqueId.create(), members: [] };
        mappedLesson = { ...lesson };
        mappedRoom = { ...room, owner: { _id: room.owner } };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapLesson.withArgs(lesson).returns(mappedLesson);
        clientDataMappingService.mapRoom.withArgs(room, user).resolves(mappedRoom);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', { lesson: mappedLesson, room: mappedRoom, templateSections: [] });
      });
    });

    describe('when the request contains template lesson ID', () => {
      let templateLessonId;
      let templateLesson;
      let mappedTemplateLesson;
      let templateSections;

      beforeEach(() => {
        templateLessonId = uniqueId.create();
        req = { user, params: { 0: '/slug', lessonId }, query: { templateLessonId } };
        lesson = { _id: lessonId, roomId, slug: 'slug' };
        room = { access: ROOM_ACCESS_LEVEL.public, owner: uniqueId.create(), members: [] };
        mappedLesson = { ...lesson };
        mappedRoom = { ...room, owner: { _id: room.owner } };
        templateLesson = {
          _id: templateLessonId,
          roomId: lesson.roomId,
          sections: [
            { key: uniqueId.create(), type: 'markdown', content: {} },
            { key: uniqueId.create(), type: 'markdown', content: {} },
            { key: uniqueId.create(), type: 'markdown', content: {} }
          ]
        };
        mappedTemplateLesson = { ...templateLesson };
        templateSections = [
          { key: uniqueId.create(), type: 'markdown', content: {} },
          { key: uniqueId.create(), type: 'markdown', content: {} },
          { key: uniqueId.create(), type: 'markdown', content: {} }
        ];

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        lessonService.getLessonById.withArgs(templateLessonId).resolves(templateLesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapLesson.withArgs(lesson).returns(mappedLesson);
        clientDataMappingService.mapLesson.withArgs(templateLesson).returns(mappedTemplateLesson);
        clientDataMappingService.mapRoom.withArgs(room, user).resolves(mappedRoom);
        clientDataMappingService.createProposedLessonSections.withArgs(mappedTemplateLesson).returns(templateSections);

        return sut.handleGetLessonPage(req, res);
      });

      it('should send the rendered page including the template sections', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'lesson', {
          lesson: mappedLesson,
          room: mappedRoom,
          templateSections
        });
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

    describe('when the user neither owns nor is not a collaborator of the room to contain the lesson', () => {
      beforeEach(() => {
        req = { user, body: { roomId } };
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: uniqueId.create() }]
        };

        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostLesson(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a member of the (exclusive) room to contain the lesson', () => {
      beforeEach(() => {
        req = { user, body: { roomId } };
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: user._id }]
        };

        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostLesson(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user owns the room to contain the lesson', () => {
      let newLesson;

      beforeEach(done => {
        room = {
          _id: roomId,
          owner: user._id,
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: uniqueId.create() }]
        };
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

    describe('when the user is a collaborator of the room to contain the lesson', () => {
      let newLesson;

      beforeEach(done => {
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: user._id }]
        };
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

      it('should throw NotFound', async () => {
        await expect(() => sut.handlePatchLessonMetadata(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is the lesson\'s (exclusive) room member', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: user._id }]
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

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchLessonMetadata(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is not the lesson\'s room owner or collaborator', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: uniqueId.create() }]
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

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchLessonMetadata(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is the lessons\'s room owner', () => {
      let room;
      let lesson;
      let requestBody;
      let updatedLesson;

      beforeEach(done => {
        room = {
          _id: uniqueId.create(),
          owner: user._id,
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: uniqueId.create() }]
        };
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

    describe('when the user is the lessons\'s room collaborator', () => {
      let room;
      let lesson;
      let requestBody;
      let updatedLesson;

      beforeEach(done => {
        room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: user._id }]
        };
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
  });

  describe('handleDeleteLesson', () => {
    let room;
    let lesson;

    describe('when the lessonId is unknown', () => {
      beforeEach(() => {
        req = { user, params: { lessonId } };
        lesson = null;

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
      });

      it('should throw NotFound', async () => {
        await expect(sut.handleDeleteLesson(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the roomId is unknown', () => {
      beforeEach(() => {
        req = { user, params: { lessonId } };
        lesson = { _id: lessonId };
        room = null;

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw NotFound', async () => {
        await expect(sut.handleDeleteLesson(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the user neither owns nor is not a collaborator of the room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { lessonId } };
        lesson = { _id: lessonId, roomId };
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: uniqueId.create() }]
        };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handleDeleteLesson(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a member of the (exclusive) room containing the lesson', () => {
      beforeEach(() => {
        req = { user, params: { lessonId } };
        lesson = { _id: lessonId, roomId };
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: user._id }]
        };

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handleDeleteLesson(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user owns the room containing the lesson', () => {
      beforeEach(done => {
        lesson = { _id: lessonId, roomId, title: 'title', slug: 'slug', language: 'language', schedule: {} };
        room = {
          _id: roomId,
          owner: user._id,
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          members: [{ userId: uniqueId.create() }]
        };

        req = { user, params: { lessonId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);

        sut.handleDeleteLesson(req, res);
      });

      it('should call lessonService.deleteLessonById', () => {
        sinon.assert.calledWith(lessonService.deleteLessonById, lessonId);
      });
    });

    describe('when the user is a collaborator of the room containing the lesson', () => {
      beforeEach(done => {
        lesson = { _id: lessonId, roomId, title: 'title', slug: 'slug', language: 'language', schedule: {} };
        room = {
          _id: roomId,
          owner: uniqueId.create(),
          lessonsMode: ROOM_LESSONS_MODE.collaborative,
          members: [{ userId: user._id }]
        };

        req = { user, params: { lessonId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        lessonService.getLessonById.withArgs(lessonId).resolves(lesson);
        roomService.getRoomById.withArgs(roomId).resolves(room);

        sut.handleDeleteLesson(req, res);
      });

      it('should call lessonService.deleteLessonById', () => {
        sinon.assert.calledWith(lessonService.deleteLessonById, lessonId);
      });
    });
  });
});
