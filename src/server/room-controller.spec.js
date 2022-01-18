import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_ACCESS_LEVEL } from '../domain/constants.js';
import uniqueId from '../utils/unique-id.js';

const { NotFound, Forbidden } = httpErrors;

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
      getRoomById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub(),
      getRoomInvitations: sandbox.stub(),
      deleteRoom: sandbox.stub()
    };
    lessonService = {
      getLessons: sandbox.stub()
    };
    mailService = {
      sendRoomInvitation: sandbox.stub(),
      sendRoomDeletionNotification: sandbox.stub()
    };
    user = {
      username: 'dagobert-the-third',
      _id: 'Ludwig the great'
    };
    serverConfig = {
      areRoomsEnabled: true
    };

    clientDataMapper = {
      mapRoom: sandbox.stub(),
      mapLessons: sandbox.stub(),
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

  describe('handlePostRoomInvitation', () => {

    describe('when all goes well', () => {
      const room = { roomId: 'roomId', name: 'Mein schöner Raum' };
      const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

      beforeEach(done => {
        roomService.createOrUpdateInvitation.resolves({
          room,
          owner: user,
          invitation
        });
        mailService.sendRoomInvitation.resolves();

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

      it('should have called mailService.sendRoomInvitation', () => {
        sinon.assert.calledWith(mailService.sendRoomInvitation, {
          roomName: 'Mein schöner Raum',
          ownerName: 'dagobert-the-third',
          email: 'invited@user.com',
          invitationLink: 'https://educandu.dev/room-membership-confirmation/94zv87nt2zztc8m3zt2z3845z8txc'
        });
      });
    });

    describe('when the service call fails', () => {
      beforeEach(() => {
        roomService.createOrUpdateInvitation.returns(Promise.reject(new NotFound()));

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', email: 'invited@user.com' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should propagate the error', () => {
        expect(() => sut.handlePostRoomInvitation(req, res)).rejects.toThrow(NotFound);
      });
    });

  });

  describe('handlePostRoomInvitationConfirm', () => {
    const room = { roomId: 'roomId', name: 'Mein schöner Raum' };
    const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

    beforeEach(done => {
      roomService.createOrUpdateInvitation.resolves({
        room,
        owner: user,
        invitation
      });
      mailService.sendRoomInvitation.resolves();

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

    describe('when the room is private', () => {
      const room = { _id: 'roomId', name: 'Mein schöner Raum', owner: 'owner', access: ROOM_ACCESS_LEVEL.private };
      const mappedRoom = { ...room };

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        clientDataMapper.mapRoom.resolves(mappedRoom);
      });

      describe('and the request is made by the room owner', () => {
        const request = {
          params: { roomId: 'roomId' },
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

          clientDataMapper.mapLessons.returns(mappedLessons);
          clientDataMapper.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, 'roomId');
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, room);
        });

        it('should call getRoomInvitations', () => {
          sinon.assert.calledWith(roomService.getRoomInvitations, 'roomId');
        });

        it('should call mapRoomInvitations with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoomInvitations, invitations);
        });

        it('should call getLessons', () => {
          sinon.assert.calledWith(lessonService.getLessons, 'roomId');
        });

        it('should call mapLessons with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapLessons, lessons);
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
          params: { roomId: 'roomId' },
          user: { _id: 'member' }
        };

        const lessons = [];
        const mappedLessons = [];
        const mappedInvitations = [];

        beforeEach(async () => {
          roomService.isRoomOwnerOrMember.resolves(true);
          lessonService.getLessons.resolves(lessons);

          clientDataMapper.mapLessons.returns(mappedLessons);
          clientDataMapper.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, 'roomId');
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, room);
        });

        it('should not call getRoomInvitations', () => {
          sinon.assert.notCalled(roomService.getRoomInvitations);
        });

        it('should call getLessons', () => {
          sinon.assert.calledWith(lessonService.getLessons, 'roomId');
        });

        it('should call mapLessons with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapLessons, lessons);
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
          params: { roomId: 'roomId' },
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
      const request = {
        params: { roomId: 'roomId' },
        user: { _id: 'someGuy' }
      };

      const room = { _id: 'roomId', name: 'Mein schöner Raum', owner: 'owner', access: ROOM_ACCESS_LEVEL.public };
      const mappedRoom = { ...room };

      const lessons = [];
      const mappedLessons = [];

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        lessonService.getLessons.resolves(lessons);

        clientDataMapper.mapRoom.resolves(mappedRoom);
        clientDataMapper.mapLessons.returns(mappedLessons);
        clientDataMapper.mapRoomInvitations.returns([]);
      });

      beforeEach(async () => {
        lessonService.getLessons.resolves(lessons);
        await sut.handleGetRoomPage(request, {});
      });

      it('should call getRoomById with roomId', () => {
        sinon.assert.calledWith(roomService.getRoomById, 'roomId');
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
        sinon.assert.calledWith(lessonService.getLessons, 'roomId');
      });

      it('should call mapLessons with the invitations returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapLessons, lessons);
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
        expect(() => sut.handleGetRoomPage({ params: { roomId: 'abc' } }).rejects.toThrow(NotFound));
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

    it('should call sendRoomDeletionNotification with the right emails', () => {
      sinon.assert.calledWith(mailService.sendRoomDeletionNotification, { email: 'email1', roomName, ownerName: user.username });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotification, { email: 'email2', roomName, ownerName: user.username });
    });

    it('should return status 200 when all goes well', () => {
      expect(res.statusCode).toBe(200);
    });
  });

});
