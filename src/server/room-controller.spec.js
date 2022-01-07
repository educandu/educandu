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
      mapRoom: sandbox.stub()
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
        roomService.createOrUpdateInvitation.returns(Promise.resolve({
          room,
          owner: user,
          invitation
        }));
        mailService.sendRoomInvitation.returns(Promise.resolve());

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
      roomService.createOrUpdateInvitation.returns(Promise.resolve({
        room,
        owner: user,
        invitation
      }));
      mailService.sendRoomInvitation.returns(Promise.resolve());

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
    const privateRoom = { roomId: 'roomId', name: 'Mein schöner Raum', owner: 'owner', access: ROOM_ACCESS_LEVEL.private };

    beforeEach(() => {
      clientDataMapper.mapRoom.resolves(privateRoom);

      roomService.getRoomById.callsFake(roomId => {
        if (roomId === privateRoom.roomId) {
          return Promise.resolve(privateRoom);
        }
        return Promise.resolve();
      });
    });

    describe('when the private room exists', () => {
      describe('and the room owner calls', () => {

        const request = {
          params: {
            roomId: 'roomId'
          },
          user: {
            _id: 'owner'
          }
        };

        const invitations = [{ email: 'lae@bucalae.com', sentOn: new Date() }];
        const lessons = [];

        beforeEach(async () => {
          roomService.getRoomInvitations.resolves(invitations);
          roomService.isRoomOwnerOrMember.resolves(true);
          lessonService.getLessons.resolves(lessons);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, 'roomId');
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, privateRoom);
        });

        it('should call getRoomInvitations', () => {
          sinon.assert.calledWith(roomService.getRoomInvitations, 'roomId');
        });

        it('should call getLessons', () => {
          sinon.assert.calledWith(lessonService.getLessons, 'roomId');
        });

        it('should call pageRenderer with the right parameters', () => {
          sinon.assert.calledWith(pageRenderer.sendPage, request, {}, PAGE_NAME.room, { room: privateRoom, invitations, lessons });
        });
      });

      describe('and a member calls', () => {
        const request = {
          params: {
            roomId: 'roomId'
          },
          user: {
            _id: 'member'
          }
        };

        const lessons = [];

        beforeEach(async () => {
          roomService.isRoomOwnerOrMember.resolves(true);
          lessonService.getLessons.resolves(lessons);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, 'roomId');
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMapper.mapRoom, privateRoom);
        });

        it('should not call getRoomInvitations', () => {
          sinon.assert.notCalled(roomService.getRoomInvitations);
        });

        it('should call pageRenderer with the right parameters', () => {
          sinon.assert.calledWith(pageRenderer.sendPage, request, {}, PAGE_NAME.room, { room: privateRoom, invitations: [], lessons });
        });
      });

      describe('and an unauthorized user for the room calls', () => {
        const request = {
          params: {
            roomId: 'roomId'
          },
          user: {
            _id: 'randomGuy'
          }
        };

        const lessons = [];

        beforeEach(() => {
          roomService.isRoomOwnerOrMember.resolves(false);
          lessonService.getLessons.resolves(lessons);
        });

        it('should throw a forbidden exception', () => {
          expect(() => sut.handleGetRoomPage(request, res)).rejects.toThrow(Forbidden);
        });
      });
    });

    describe('when the public room exists', () => {
      const request = {
        params: {
          roomId: 'roomId'
        },
        user: {
          _id: 'someGuy'
        }
      };

      const publicRoom = { ...privateRoom, access: ROOM_ACCESS_LEVEL.public };
      const lessons = [];

      beforeEach(async () => {
        roomService.getRoomById.resolves(publicRoom);
        lessonService.getLessons.resolves(lessons);
        await sut.handleGetRoomPage(request, {});
      });

      it('should not check if the room caller is the owner or a member', () => {
        sinon.assert.notCalled(roomService.isRoomOwnerOrMember);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, request, {}, PAGE_NAME.room, { room: privateRoom, invitations: [], lessons });
      });
    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', () => {
        expect(() => sut.handleGetRoomPage({ params: { roomId: 'abc' } }).rejects.toThrow(NotFound));
      });
    });
  });

  describe('handleAuthorizeResourcesAccess', () => {
    const roomId = '843zvnzn2vw';
    describe('when the user is authorized', () => {
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

      it('should return status 200 when the user is authorized', () => {
        expect(res.statusCode).toBe(200);
      });

    });
    describe('when the user is not authorized', () => {
      beforeEach(() => {
        roomService.isRoomOwnerOrMember.resolves(false);
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: 'abcd' }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should throw a not authorized exception', () => {
        expect(() => sut.handleAuthorizeResourcesAccess(req, res)).rejects.toThrow(Forbidden);
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
