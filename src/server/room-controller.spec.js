import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';

const { NotFound, Forbidden } = httpErrors;

describe('room-controller', () => {
  const sandbox = sinon.createSandbox();

  let roomService;
  let mailService;
  let serverConfig;
  let clientDataMapper;
  let pageRenderer;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    roomService = {
      createOrUpdateInvitation: sandbox.stub(),
      confirmInvitation: sandbox.stub(),
      getRoomById: sandbox.stub(),
      isRoomMemberOrOwner: sandbox.stub()
    };
    mailService = {
      sendRoomInvitation: sandbox.stub()
    };
    user = {
      username: 'dagobert-the-third',
      _id: 'Ludwig the great'
    };
    serverConfig = {
      disabledFeatures: []
    };

    clientDataMapper = {
      mapRoom: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    sut = new RoomController(serverConfig, roomService, mailService, clientDataMapper, pageRenderer);
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

  describe('handleGetRoom', () => {
    const room = { roomId: 'roomId', name: 'Mein schöner Raum' };

    describe('when the room exists', () => {
      const request = {
        params: {
          roomId: 'roomId'
        }
      };

      beforeEach(async () => {
        clientDataMapper.mapRoom.resolves(room);
        roomService.getRoomById.callsFake(roomId => {
          if (roomId === room.roomId) {
            return Promise.resolve(room);
          }
          return Promise.resolve();
        });
        await sut.handleGetRoom(request, {});
      });

      it('should call getRoomById with roomId', () => {
        sinon.assert.calledWith(roomService.getRoomById, 'roomId');
      });

      it('should call mapRoom with the room returned by the service', () => {
        sinon.assert.calledWith(clientDataMapper.mapRoom, room);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, request, {}, PAGE_NAME.room, { roomDetails: room });
      });
    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', () => {
        expect(() => sut.handleGetRoom({ params: { roomId: 'abc' } }).rejects.toThrow(NotFound));
      });
    });
  });

  describe('handleAuthorizeResourcesAccess', () => {
    const roomId = '843zvnzn2vw';
    describe('when the user is authorized', () => {
      beforeEach(done => {
        roomService.isRoomMemberOrOwner.resolves(true);
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handleAuthorizeResourcesAccess(req, res);
      });

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomMemberOrOwner, roomId, user._id);
      });

      it('should return status 200 when the user is authorized', () => {
        expect(res.statusCode).toBe(200);
      });

    });
    describe('when the user is not authorized', () => {
      beforeEach(() => {
        roomService.isRoomMemberOrOwner.resolves(false);
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
});
