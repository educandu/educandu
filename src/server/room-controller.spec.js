/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import uniqueId from '../utils/unique-id.js';

const { NotFound, Forbidden, BadRequest, Unauthorized } = httpErrors;

describe('room-controller', () => {
  const sandbox = sinon.createSandbox();

  let roomService;
  let lessonService;
  let mailService;
  let serverConfig;
  let clientDataMapper;
  let pageRenderer;
  let userService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    roomService = {
      createOrUpdateInvitation: sandbox.stub(),
      confirmInvitation: sandbox.stub(),
      getRoomsOwnedByUser: sandbox.stub(),
      getRoomById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub(),
      getRoomInvitations: sandbox.stub(),
      createRoom: sandbox.stub(),
      updateRoom: sandbox.stub(),
      deleteRoom: sandbox.stub()
    };
    lessonService = {
      getLessons: sandbox.stub()
    };
    mailService = {
      sendRoomInvitationEmail: sandbox.stub(),
      sendRoomDeletionNotificationEmail: sandbox.stub()
    };
    user = {
      _id: uniqueId.create(),
      username: 'dagobert-the-third'
    };
    serverConfig = {
      areRoomsEnabled: true
    };

    clientDataMapper = {
      mapRoom: sandbox.stub(),
      mapLessonsMetadata: sandbox.stub(),
      mapRoomInvitations: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    userService = {
      getUsersByIds: sandbox.stub()
    };

    sut = new RoomController(serverConfig, roomService, userService, lessonService, mailService, clientDataMapper, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostRoom', () => {

    describe('when the request data is valid', () => {
      const createdRoom = {};

      beforeEach(done => {
        roomService.createRoom.resolves(createdRoom);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { name: 'name', slug: 'slug', access: ROOM_ACCESS_LEVEL.public }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePostRoom(req, res);
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should respond with the created room', () => {
        expect(res._getData()).toEqual(createdRoom);
      });
    });
  });

  describe('handlePatchRoom', () => {

    describe('when the request data is valid', () => {
      let room;
      let requestBody;
      let updatedRoom;

      beforeEach(done => {
        room = {
          _id: uniqueId.create(),
          owner: user._id,
          name: 'name',
          slug: 'slug',
          access: ROOM_ACCESS_LEVEL.public,
          description: 'description'
        };
        requestBody = {
          name: 'new name',
          slug: 'new-slug',
          description: 'new description'
        };
        updatedRoom = {
          ...room,
          ...requestBody
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.updateRoom.resolves(updatedRoom);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: room._id },
          body: { ...requestBody }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePatchRoom(req, res);
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call roomService.updateRoom', () => {
        sinon.assert.calledWith(roomService.updateRoom, { ...room, ...requestBody });
      });

      it('should respond with the updated room', () => {
        expect(res._getData()).toEqual(updatedRoom);
      });
    });

    describe('when the request contains an unknown room id', () => {
      beforeEach(() => {
        const roomId = uniqueId.create();

        roomService.getRoomById.withArgs(roomId).resolves(null);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId },
          body: { name: 'new name', slug: 'new-slug' }
        });
        req.user = user;

        res = {};
      });

      it('should throw NotFound', () => {
        expect(() => sut.handlePatchRoom(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request is made by a user which is not the room owner', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          access: ROOM_ACCESS_LEVEL.public
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: room._id },
          body: { name: 'new name', slug: 'new-slug' }
        });
        req.user = user;

        res = {};
      });

      it('should throw Forbidden', () => {
        expect(() => sut.handlePatchRoom(req, res)).rejects.toThrow(Forbidden);
      });
    });
  });

  describe('handlePostRoomInvitation', () => {

    describe('when the request data is valid', () => {
      const room = { roomId: uniqueId.create(), name: 'Mein schöner Raum' };
      const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

      beforeEach(done => {
        roomService.createOrUpdateInvitation.resolves({
          room,
          owner: user,
          invitation
        });
        mailService.sendRoomInvitationEmail.resolves();

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', email: 'invited@user.com' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePostRoomInvitation(req, res);
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should respond with the created/updated invitation', () => {
        expect(res._getData()).toEqual(invitation);
      });

      it('should have called roomService.createOrUpdateInvitation', () => {
        sinon.assert.calledWith(roomService.createOrUpdateInvitation, {
          roomId: '843zvnzn2vw',
          email: 'invited@user.com',
          user
        });
      });

      it('should have called mailService.sendRoomInvitationEmail', () => {
        sinon.assert.calledWith(mailService.sendRoomInvitationEmail, {
          roomName: 'Mein schöner Raum',
          ownerName: 'dagobert-the-third',
          email: 'invited@user.com',
          invitationLink: 'https://educandu.dev/room-membership-confirmation/94zv87nt2zztc8m3zt2z3845z8txc'
        });
      });
    });

    describe('when the request data is invalid and causes a BadRequest', () => {
      beforeEach(() => {
        roomService.createOrUpdateInvitation.returns(Promise.reject(new BadRequest()));

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', email: 'invited@user.com' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should propagate the error', () => {
        expect(() => sut.handlePostRoomInvitation(req, res)).rejects.toThrow(BadRequest);
      });
    });

  });

  describe('handlePostRoomInvitationConfirm', () => {
    const room = { roomId: uniqueId.create(), name: 'Mein schöner Raum' };
    const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

    beforeEach(done => {
      roomService.createOrUpdateInvitation.resolves({
        room,
        owner: user,
        invitation
      });
      mailService.sendRoomInvitationEmail.resolves();

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' },
        body: { token: invitation.token }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      sut.handlePostRoomInvitationConfirm(req, res);
    });

    it('should respond with status code 201', () => {
      expect(res.statusCode).toBe(201);
    });
  });

  describe('handleGetRoomPage', () => {

    describe('when user is not provided (session expired)', () => {
      beforeEach(() => {
        const room = { _id: uniqueId.create(), slug: '', access: ROOM_ACCESS_LEVEL.private };
        roomService.getRoomById.resolves(room);

        req = { params: { 0: '', roomId: room._id } };
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleGetRoomPage(req, {})).rejects.toThrow(Unauthorized);
      });
    });

    describe('when the room is private', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug',
        owner: 'owner',
        access: ROOM_ACCESS_LEVEL.private
      };
      const mappedRoom = { ...room };

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        clientDataMapper.mapRoom.resolves(mappedRoom);
      });

      describe('and the request is made by the room owner', () => {
        const request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'owner' }
        };

        const lessons = [];
        const invitations = [{ email: 'test@test.com', sentOn: new Date() }];

        const mappedLessons = [];
        const mappedInvitations = [{ email: 'test@test.com', sentOn: new Date().toISOString() }];

        beforeEach(async () => {
          roomService.isRoomOwnerOrMember.resolves(true);

          lessonService.getLessons.resolves(lessons);
          roomService.getRoomInvitations.resolves(invitations);

          clientDataMapper.mapLessonsMetadata.returns(mappedLessons);
          clientDataMapper.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, room._id);
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, room);
        });

        it('should call getRoomInvitations', () => {
          sinon.assert.calledWith(roomService.getRoomInvitations, room._id);
        });

        it('should call mapRoomInvitations with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoomInvitations, invitations);
        });

        it('should call getLessons', () => {
          sinon.assert.calledWith(lessonService.getLessons, room._id);
        });

        it('should call mapLessonsMetadata with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapLessonsMetadata, lessons);
        });

        it('should call pageRenderer with the right parameters', () => {
          sinon.assert.calledWith(
            pageRenderer.sendPage,
            request,
            {},
            PAGE_NAME.room,
            { room: mappedRoom, lessons: mappedLessons, invitations: mappedInvitations }
          );
        });
      });

      describe('and the request is made by a room member', () => {
        const request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'member' }
        };

        const lessons = [];
        const mappedLessons = [];
        const mappedInvitations = [];

        beforeEach(async () => {
          roomService.isRoomOwnerOrMember.resolves(true);
          lessonService.getLessons.resolves(lessons);

          clientDataMapper.mapLessonsMetadata.returns(mappedLessons);
          clientDataMapper.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, room._id);
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, room);
        });

        it('should not call getRoomInvitations', () => {
          sinon.assert.notCalled(roomService.getRoomInvitations);
        });

        it('should call getLessons', () => {
          sinon.assert.calledWith(lessonService.getLessons, room._id);
        });

        it('should call mapLessonsMetadata with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapLessonsMetadata, lessons);
        });

        it('should call pageRenderer with the right parameters', () => {
          sinon.assert.calledWith(
            pageRenderer.sendPage,
            request,
            {},
            PAGE_NAME.room,
            { room: mappedRoom, lessons: mappedLessons, invitations: mappedInvitations }
          );
        });
      });

      describe('and the request is mabe by an unauthorized user', () => {
        const request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'randomGuy' }
        };

        beforeEach(() => {
          roomService.isRoomOwnerOrMember.resolves(false);
        });

        it('should throw a forbidden exception', () => {
          expect(() => sut.handleGetRoomPage(request, res)).rejects.toThrow(Forbidden);
        });
      });
    });

    describe('when room is public', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug',
        owner: 'owner',
        access: ROOM_ACCESS_LEVEL.public
      };

      const request = {
        params: { 0: `/${room.slug}`, roomId: room._id },
        user: { _id: 'someGuy' }
      };

      const mappedRoom = { ...room };

      const lessons = [];
      const mappedLessons = [];

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        lessonService.getLessons.resolves(lessons);

        clientDataMapper.mapRoom.resolves(mappedRoom);
        clientDataMapper.mapLessonsMetadata.returns(mappedLessons);
        clientDataMapper.mapRoomInvitations.returns([]);
      });

      beforeEach(async () => {
        lessonService.getLessons.resolves(lessons);
        await sut.handleGetRoomPage(request, {});
      });

      it('should call getRoomById with roomId', () => {
        sinon.assert.calledWith(roomService.getRoomById, room._id);
      });

      it('should not check if the room caller is the owner or a member', () => {
        sinon.assert.notCalled(roomService.isRoomOwnerOrMember);
      });

      it('should call mapRoom with the room returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapRoom, room);
      });

      it('should not call getRoomInvitations', () => {
        sinon.assert.notCalled(roomService.getRoomInvitations);
      });

      it('should call mapRoomInvitations with the invitations returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapRoomInvitations, []);
      });

      it('should call getLessons', () => {
        sinon.assert.calledWith(lessonService.getLessons, room._id);
      });

      it('should call mapLessonsMetadata with the invitations returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapLessonsMetadata, lessons);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(
          pageRenderer.sendPage,
          request,
          {},
          PAGE_NAME.room,
          { room: mappedRoom, lessons: mappedLessons, invitations: [] }
        );
      });
    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', () => {
        expect(() => sut.handleGetRoomPage({ params: { 0: '', roomId: 'abc' } }).rejects.toThrow(NotFound));
      });
    });

    describe('when the room slug is different than the URL slug', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug'
      };

      beforeEach(done => {
        req = { user, params: { 0: '/url-slug', roomId: room._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        roomService.getRoomById.withArgs(room._id).resolves(room);

        sut.handleGetRoomPage(req, res);
      });

      it('should redirect to the correct room url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl()).toBe(`/rooms/${room._id}/room-slug`);
      });
    });
  });

  describe('handleAuthorizeResourcesAccess', () => {
    describe('when there is no authenticated user', () => {
      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: 'abcd' }
        });
        req.user = null;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        roomService.isRoomOwnerOrMember.resolves(false);
        sut.handleAuthorizeResourcesAccess(req, res);
      });

      it('should return status 401', () => {
        expect(res.statusCode).toBe(401);
      });
    });

    describe('when the user is authenticated but not authorized', () => {
      const roomId = '843zvnzn2vw';

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        roomService.isRoomOwnerOrMember.resolves(false);
        sut.handleAuthorizeResourcesAccess(req, res);
      });

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
      });

      it('should return status 403', () => {
        expect(res.statusCode).toBe(403);
      });
    });

    describe('when the user is authenticated and authorized', () => {
      const roomId = '843zvnzn2vw';

      beforeEach(done => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        roomService.isRoomOwnerOrMember.resolves(true);
        sut.handleAuthorizeResourcesAccess(req, res);
      });

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
      });

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('handleDeleteRooms', () => {
    const userJacky = [{ _id: uniqueId.create(), email: 'jacky@test.com' }];
    const userClare = [{ _id: uniqueId.create(), email: 'clare@test.com' }];
    const userDrake = [{ _id: uniqueId.create(), email: 'drake@test.com' }];
    const roomA = { _id: uniqueId.create(), name: 'Room A', access: ROOM_ACCESS_LEVEL.private, members: [{ userId: userJacky._id }, { userId: userClare._id }] };
    const roomB = { _id: uniqueId.create(), name: 'Room B', access: ROOM_ACCESS_LEVEL.private, members: [{ userId: userClare._id }, { userId: userDrake._id }] };
    const roomC = { _id: uniqueId.create(), name: 'Room C', access: ROOM_ACCESS_LEVEL.public, members: [{ userId: userJacky._id }, { userId: userDrake._id }] };

    beforeEach(done => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' },
        query: { ownerId: user._id, access: ROOM_ACCESS_LEVEL.private }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      roomService.getRoomsOwnedByUser.resolves([roomA, roomB]);
      roomService.deleteRoom.withArgs(roomA._id, user).resolves(roomA);
      roomService.deleteRoom.withArgs(roomB._id, user).resolves(roomB);
      userService.getUsersByIds.callsFake(ids => Promise.resolve(ids.map(id => [userJacky, userClare, userDrake].find(x => x._id === id))));

      sut.handleDeleteRooms(req, res);
    });

    it('should call delete room for each room on roomService', () => {
      sinon.assert.calledWith(roomService.deleteRoom, roomA._id, user);
      sinon.assert.calledWith(roomService.deleteRoom, roomB._id, user);
    });

    it('should not call delete room for rooms with a different access level', () => {
      sinon.assert.neverCalledWith(roomService.deleteRoom, roomC._id, user);
    });

    it('should call getUsersByIds for each room with the right ids', () => {
      sinon.assert.calledWith(userService.getUsersByIds, roomA.members.map(({ userId }) => userId));
      sinon.assert.calledWith(userService.getUsersByIds, roomB.members.map(({ userId }) => userId));
    });

    it('should call sendRoomDeletionNotificationEmail with the right emails', () => {
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: userJacky.email, roomName: roomA.name, ownerName: user.username });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: userClare.email, roomName: roomA.name, ownerName: user.username });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: userClare.email, roomName: roomB.name, ownerName: user.username });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: userDrake.email, roomName: roomB.name, ownerName: user.username });
    });

    it('should not call sendRoomDeletionNotificationEmail with the emails for rooms with a different access level', () => {
      sinon.assert.neverCalledWith(mailService.sendRoomDeletionNotificationEmail, {
        email: sinon.match.string,
        roomName: roomC.name,
        ownerName: user.username
      });
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });

  describe('handleDeleteRoom', () => {
    const roomId = uniqueId.create();
    const members = [{ userId: uniqueId.create() }, { userId: uniqueId.create() }];
    const roomName = 'my room';
    const users = [{ email: 'email1' }, { email: 'email2' }];

    beforeEach(done => {
      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' },
        params: { roomId }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      roomService.deleteRoom.resolves({ members, name: roomName });
      userService.getUsersByIds.resolves(users);

      sut.handleDeleteRoom(req, res);
    });

    it('should call delete room on roomService', () => {
      sinon.assert.calledWith(roomService.deleteRoom, roomId, user);
    });

    it('should call getUsersByIds with the right ids', () => {
      sinon.assert.calledWith(userService.getUsersByIds, members.map(({ userId }) => userId));
    });

    it('should call sendRoomDeletionNotificationEmail with the right emails', () => {
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: 'email1', roomName, ownerName: user.username });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmail, { email: 'email2', roomName, ownerName: user.username });
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });

});
