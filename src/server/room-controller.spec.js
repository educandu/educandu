/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_ACCESS_LEVEL, ROOM_LESSONS_MODE } from '../domain/constants.js';

const { NotFound, Forbidden, BadRequest, Unauthorized } = httpErrors;

describe('room-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let storageService;
  let lessonService;
  let serverConfig;
  let pageRenderer;
  let roomService;
  let userService;
  let mailService;
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
      getRoomInvitationById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub(),
      getRoomInvitations: sandbox.stub(),
      createRoom: sandbox.stub(),
      updateRoom: sandbox.stub(),
      removeRoomMember: sandbox.stub(),
      deleteRoomInvitation: sandbox.stub()
    };
    lessonService = {
      getLessonsMetadata: sandbox.stub()
    };
    userService = {
      getUserById: sandbox.stub()
    };
    storageService = {
      deleteRoomAndResources: sandbox.stub()
    };
    mailService = {
      sendRoomInvitationEmail: sandbox.stub(),
      sendRoomDeletionNotificationEmails: sandbox.stub(),
      sendRoomMemberRemovalNotificationEmail: sandbox.stub(),
      sendRoomInvitationDeletionNotificationEmail: sandbox.stub()
    };
    user = {
      _id: uniqueId.create(),
      username: 'dagobert-the-third'
    };
    serverConfig = {
      areRoomsEnabled: true
    };

    clientDataMappingService = {
      mapRoom: sandbox.stub(),
      mapLessonsMetadata: sandbox.stub(),
      mapRoomInvitations: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };
    sut = new RoomController(serverConfig, roomService, lessonService, userService, storageService, mailService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostRoom', () => {

    describe('when the request data is valid', () => {
      const createdRoom = {};

      beforeEach(() => new Promise((resolve, reject) => {
        roomService.createRoom.resolves(createdRoom);

        req = {
          user,
          body: { name: 'name', slug: 'slug', access: ROOM_ACCESS_LEVEL.public, lessonsMode: ROOM_LESSONS_MODE.exclusive }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePostRoom(req, res).catch(reject);
      }));

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

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          owner: user._id,
          name: 'name',
          slug: 'slug',
          access: ROOM_ACCESS_LEVEL.public,
          lessonsMode: ROOM_LESSONS_MODE.exclusive,
          description: 'description'
        };
        requestBody = {
          name: 'new name',
          slug: 'new-slug',
          description: 'new description',
          lessonsMode: ROOM_LESSONS_MODE.collaborative
        };
        updatedRoom = {
          ...room,
          ...requestBody
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.updateRoom.resolves(updatedRoom);

        req = { user, params: { roomId: room._id }, body: { ...requestBody } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePatchRoom(req, res).catch(reject);
      }));

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

        req = { user, params: { roomId }, body: { name: 'new name', slug: 'new-slug' } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handlePatchRoom(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request is made by a user which is not the room owner', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          access: ROOM_ACCESS_LEVEL.public,
          lessonsMode: ROOM_LESSONS_MODE.exclusive
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = { user, params: { roomId: room._id }, body: { name: 'new name', slug: 'new-slug' } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchRoom(req, res)).rejects.toThrow(Forbidden);
      });
    });
  });

  describe('handlePostRoomInvitation', () => {

    describe('when the request data is valid', () => {
      const room = { roomId: uniqueId.create(), name: 'Mein schöner Raum' };
      const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

      beforeEach(() => new Promise((resolve, reject) => {
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
        res.on('end', resolve);

        sut.handlePostRoomInvitation(req, res).catch(reject);
      }));

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

      it('should propagate the error', async () => {
        await expect(() => sut.handlePostRoomInvitation(req, res)).rejects.toThrow(BadRequest);
      });
    });

  });

  describe('handlePostRoomInvitationConfirm', () => {
    const room = { roomId: uniqueId.create(), name: 'Mein schöner Raum' };
    const invitation = { token: '94zv87nt2zztc8m3zt2z3845z8txc' };

    beforeEach(() => new Promise((resolve, reject) => {
      roomService.createOrUpdateInvitation.resolves({
        room,
        owner: user,
        invitation
      });
      mailService.sendRoomInvitationEmail.resolves();

      req = { user, body: { token: invitation.token } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handlePostRoomInvitationConfirm(req, res).catch(reject);
    }));

    it('should respond with status code 201', () => {
      expect(res.statusCode).toBe(201);
    });
  });

  describe('handleGetRoomPage', () => {

    describe('when user is not provided (session expired)', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          slug: '',
          access: ROOM_ACCESS_LEVEL.private,
          lessonsMode: ROOM_LESSONS_MODE.exclusive
        };
        roomService.getRoomById.resolves(room);

        req = { params: { 0: '', roomId: room._id } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleGetRoomPage(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when the room is private', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug',
        owner: 'owner',
        access: ROOM_ACCESS_LEVEL.private,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };
      const mappedRoom = { ...room };

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        clientDataMappingService.mapRoom.resolves(mappedRoom);
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

          lessonService.getLessonsMetadata.resolves(lessons);
          roomService.getRoomInvitations.resolves(invitations);

          clientDataMappingService.mapLessonsMetadata.returns(mappedLessons);
          clientDataMappingService.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, room._id);
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoom, room);
        });

        it('should call getRoomInvitations', () => {
          sinon.assert.calledWith(roomService.getRoomInvitations, room._id);
        });

        it('should call mapRoomInvitations with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoomInvitations, invitations);
        });

        it('should call getLessonsMetadata', () => {
          sinon.assert.calledWith(lessonService.getLessonsMetadata, room._id);
        });

        it('should call mapLessonsMetadata with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapLessonsMetadata, lessons);
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
          lessonService.getLessonsMetadata.resolves(lessons);

          clientDataMappingService.mapLessonsMetadata.returns(mappedLessons);
          clientDataMappingService.mapRoomInvitations.returns(mappedInvitations);

          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, room._id);
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoom, room);
        });

        it('should not call getRoomInvitations', () => {
          sinon.assert.notCalled(roomService.getRoomInvitations);
        });

        it('should call getLessonsMetadata', () => {
          sinon.assert.calledWith(lessonService.getLessonsMetadata, room._id);
        });

        it('should call mapLessonsMetadata with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapLessonsMetadata, lessons);
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

        it('should throw a forbidden exception', async () => {
          await expect(() => sut.handleGetRoomPage(request, res)).rejects.toThrow(Forbidden);
        });
      });
    });

    describe('when room is public', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug',
        owner: 'owner',
        access: ROOM_ACCESS_LEVEL.public,
        lessonsMode: ROOM_LESSONS_MODE.exclusive
      };

      const mappedRoom = { ...room };

      const lessons = [];
      const mappedLessons = [];

      beforeEach(() => {
        roomService.getRoomById.resolves(room);
        lessonService.getLessonsMetadata.resolves(lessons);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapLessonsMetadata.returns(mappedLessons);
      });

      describe('and the request is made by a user who is not the owner', () => {
        const request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'someGuy' }
        };

        beforeEach(async () => {
          roomService.getRoomInvitations.resolves([]);
          clientDataMappingService.mapRoomInvitations.returns([]);

          lessonService.getLessonsMetadata.resolves(lessons);
          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomById with roomId', () => {
          sinon.assert.calledWith(roomService.getRoomById, room._id);
        });

        it('should not check if the room caller is the owner or a member', () => {
          sinon.assert.notCalled(roomService.isRoomOwnerOrMember);
        });

        it('should call mapRoom with the room returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoom, room);
        });

        it('should not call getRoomInvitations', () => {
          sinon.assert.notCalled(roomService.getRoomInvitations);
        });

        it('should call mapRoomInvitations with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoomInvitations, []);
        });

        it('should call getLessonsMetadata', () => {
          sinon.assert.calledWith(lessonService.getLessonsMetadata, room._id);
        });

        it('should call mapLessonsMetadata with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapLessonsMetadata, lessons);
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

      describe('and the request is made by the room owner', () => {
        const request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'owner' }
        };

        const invitations = [{ email: 'test@test.com', sentOn: new Date() }];
        const mappedInvitations = [{ email: 'test@test.com', sentOn: new Date().toISOString() }];

        beforeEach(async () => {
          roomService.getRoomInvitations.resolves(invitations);
          clientDataMappingService.mapRoomInvitations.returns(mappedInvitations);

          lessonService.getLessonsMetadata.resolves(lessons);
          await sut.handleGetRoomPage(request, {});
        });

        it('should call getRoomInvitations', () => {
          sinon.assert.calledWith(roomService.getRoomInvitations, room._id);
        });

        it('should call mapRoomInvitations with the invitations returned by the service', () => {
          sinon.assert.calledWith(clientDataMappingService.mapRoomInvitations, invitations);
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

    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', async () => {
        await expect(() => sut.handleGetRoomPage({ params: { 0: '', roomId: 'abc' } })).rejects.toThrow(NotFound);
      });
    });

    describe('when the room slug is different than the URL slug', () => {
      const room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug'
      };

      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, params: { 0: '/url-slug', roomId: room._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.getRoomById.withArgs(room._id).resolves(room);

        sut.handleGetRoomPage(req, res).catch(reject);
      }));

      it('should redirect to the correct room url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl()).toBe(`/rooms/${room._id}/room-slug`);
      });
    });
  });

  describe('handleAuthorizeResourcesAccess', () => {
    describe('when there is no authenticated user', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId: 'abcd' }
        });
        req.user = null;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.isRoomOwnerOrMember.resolves(false);
        sut.handleAuthorizeResourcesAccess(req, res).catch(reject);
      }));

      it('should return status 401', () => {
        expect(res.statusCode).toBe(401);
      });
    });

    describe('when the user is authenticated but not authorized', () => {
      const roomId = '843zvnzn2vw';

      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.isRoomOwnerOrMember.resolves(false);

        sut.handleAuthorizeResourcesAccess(req, res).catch(reject);
      }));

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
      });

      it('should return status 403', () => {
        expect(res.statusCode).toBe(403);
      });
    });

    describe('when the user is authenticated and authorized', () => {
      const roomId = '843zvnzn2vw';

      beforeEach(() => new Promise((resolve, reject) => {
        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          params: { roomId }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.isRoomOwnerOrMember.resolves(true);
        sut.handleAuthorizeResourcesAccess(req, res).catch(reject);
      }));

      it('should call the room service with the correct roomId and userId', () => {
        sinon.assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
      });

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('handleDeleteRoomsForUser', () => {
    const userJacky = [{ _id: uniqueId.create(), email: 'jacky@test.com' }];
    const userClare = [{ _id: uniqueId.create(), email: 'clare@test.com' }];
    const userDrake = [{ _id: uniqueId.create(), email: 'drake@test.com' }];
    const roomA = { _id: uniqueId.create(), name: 'Room A', access: ROOM_ACCESS_LEVEL.private, members: [{ userId: userJacky._id }, { userId: userClare._id }] };
    const roomB = { _id: uniqueId.create(), name: 'Room B', access: ROOM_ACCESS_LEVEL.private, members: [{ userId: userClare._id }, { userId: userDrake._id }] };
    const roomC = { _id: uniqueId.create(), name: 'Room C', access: ROOM_ACCESS_LEVEL.public, members: [{ userId: userJacky._id }, { userId: userDrake._id }] };

    beforeEach(() => new Promise((resolve, reject) => {
      req = { user, query: { ownerId: user._id, access: ROOM_ACCESS_LEVEL.private } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      userService.getUserById.withArgs(user._id).resolves(user);
      roomService.getRoomsOwnedByUser.withArgs(user._id).resolves([roomA, roomB, roomC]);
      storageService.deleteRoomAndResources.resolves();
      mailService.sendRoomDeletionNotificationEmails.resolves();

      sut.handleDeleteRoomsForUser(req, res).catch(reject);
    }));

    it('should call storageService.deleteRoomAndResources for each room', () => {
      sinon.assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomA._id, roomOwnerId: user._id });
      sinon.assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomB._id, roomOwnerId: user._id });
    });

    it('should not call delete room for rooms with a different access level', () => {
      sinon.assert.neverCalledWith(storageService.deleteRoomAndResources, { roomId: roomC._id, roomOwnerId: user._id });
    });

    it('should call mailService.sendRoomDeletionNotificationEmails for each room', () => {
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmails, { roomName: roomA.name, ownerName: user.username, roomMembers: roomA.members });
      sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmails, { roomName: roomB.name, ownerName: user.username, roomMembers: roomB.members });
    });

    it('should not call mailService.sendRoomDeletionNotificationEmails for rooms with a different access level', () => {
      sinon.assert.neverCalledWith(mailService.sendRoomDeletionNotificationEmails, {
        roomName: roomC.name,
        ownerName: user.username,
        roomMembers: roomC.members
      });
    });

    it('should return status 200', () => {
      expect(res.statusCode).toBe(200);
    });
  });

  describe('handleDeleteOwnRoom', () => {
    describe('when the roomId is not valid', () => {
      beforeEach(() => {
        const room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id,
          members: []
        };

        roomService.getRoomById.withArgs(room._id).resolves(null);

        req = { user, params: { roomId: room._id } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteOwnRoom(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        const room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          members: []
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = { user, params: { roomId: room._id } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleDeleteOwnRoom(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the request is valid', () => {
      let room;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id,
          members: [{ userId: uniqueId.create() }, { userId: uniqueId.create() }]
        };

        storageService.deleteRoomAndResources.resolves();
        roomService.getRoomById.withArgs(room._id).resolves(room);
        mailService.sendRoomDeletionNotificationEmails.resolves();

        req = { user, params: { roomId: room._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteOwnRoom(req, res).catch(reject);
      }));

      it('should call storageService.deleteRoomAndResources', () => {
        sinon.assert.calledWith(storageService.deleteRoomAndResources, { roomId: room._id, roomOwnerId: user._id });
      });

      it('should call mailService.sendRoomDeletionNotificationEmails with the right emails', () => {
        sinon.assert.calledWith(mailService.sendRoomDeletionNotificationEmails, { roomMembers: room.members, roomName: room.name, ownerName: user.username });
      });

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('handleDeleteRoomMember', () => {
    let room;
    const memberUser = { _id: uniqueId.create() };

    describe('when the roomId is not valid', () => {
      beforeEach(() => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id,
          members: [{ userId: memberUser._id }]
        };

        roomService.getRoomById.withArgs(room._id).resolves(null);
        userService.getUserById.withArgs(memberUser._id).resolves(memberUser);

        req = { user, params: { roomId: room._id, memberUserId: memberUser._id } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteRoomMember(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the member user does not exist', () => {
      beforeEach(() => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id,
          members: [{ userId: uniqueId.create() }]
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        userService.getUserById.withArgs(memberUser._id).resolves(null);

        req = { user, params: { roomId: room._id, memberUserId: memberUser._id } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteRoomMember(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is not the room owner or a member', () => {
      beforeEach(() => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          members: [{ userId: memberUser._id }]
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        userService.getUserById.withArgs(memberUser._id).resolves(memberUser);

        req = { user, params: { roomId: room._id, memberUserId: memberUser._id } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleDeleteRoomMember(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is the room owner', () => {
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id,
          members: [{ userId: memberUser._id }, { userId: uniqueId.create() }]
        };
        const updatedRoom = { ...room, members: [room.members[1]] };
        mappedRoom = { ...updatedRoom };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        userService.getUserById.withArgs(memberUser._id).resolves(memberUser);
        roomService.removeRoomMember.withArgs({ room, memberUserId: memberUser._id }).resolves(updatedRoom);
        clientDataMappingService.mapRoom.withArgs(updatedRoom).resolves(mappedRoom);
        mailService.sendRoomMemberRemovalNotificationEmail.resolves();

        req = { user, params: { roomId: room._id, memberUserId: memberUser._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteRoomMember(req, res).catch(reject);
      }));

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the updated room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });

      it('should have called mailService.sendRoomMemberRemovalNotificationEmail', () => {
        sinon.assert.calledWith(mailService.sendRoomMemberRemovalNotificationEmail, {
          roomName: 'my room',
          ownerName: 'dagobert-the-third',
          memberUser
        });
      });
    });

    describe('when the user is a room member (and is leaving the room)', () => {
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          members: [{ userId: memberUser._id }, { userId: uniqueId.create() }]
        };
        const updatedRoom = { ...room, members: [room.members[1]] };
        mappedRoom = { ...updatedRoom };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        userService.getUserById.withArgs(memberUser._id).resolves(memberUser);
        roomService.removeRoomMember.withArgs({ room, memberUserId: memberUser._id }).resolves(updatedRoom);
        clientDataMappingService.mapRoom.withArgs(updatedRoom).resolves(mappedRoom);
        mailService.sendRoomMemberRemovalNotificationEmail.resolves();

        req = { user: memberUser, params: { roomId: room._id, memberUserId: memberUser._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteRoomMember(req, res).catch(reject);
      }));

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the updated room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });

      it('should have not called mailService.sendRoomMemberRemovalNotificationEmail', () => {
        sinon.assert.notCalled(mailService.sendRoomMemberRemovalNotificationEmail);
      });
    });
  });

  describe('handleDeleteRoomInvitation', () => {
    const invitationId = uniqueId.create();

    describe('when the invitationId is not valid', () => {
      beforeEach(() => {
        roomService.getRoomInvitationById.withArgs(invitationId).resolves(null);

        req = { user, params: { invitationId } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteRoomInvitation(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        const room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: uniqueId.create()
        };
        const invitation = {
          _id: invitationId,
          roomId: room._id,
          email: 'max.mustermann@gtest.com'
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.getRoomInvitationById.withArgs(invitationId).resolves(invitation);

        req = { user, params: { invitationId } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleDeleteRoomInvitation(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the request is valid', () => {
      let mappedInvitations;

      beforeEach(() => new Promise((resolve, reject) => {
        const room = {
          name: 'my room',
          _id: uniqueId.create(),
          owner: user._id
        };
        const invitation = {
          _id: invitationId,
          roomId: room._id,
          email: 'max.mustermann@gtest.com'
        };

        const remainingInvitations = [{ _id: uniqueId.create(), roomId: room._id }];
        mappedInvitations = [...remainingInvitations];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.getRoomInvitationById.withArgs(invitationId).resolves(invitation);
        roomService.deleteRoomInvitation.withArgs({ room, invitation }).resolves(remainingInvitations);
        clientDataMappingService.mapRoomInvitations.withArgs(remainingInvitations).returns(mappedInvitations);
        mailService.sendRoomInvitationDeletionNotificationEmail.resolves();

        req = { user, params: { invitationId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteRoomInvitation(req, res).catch(reject);
      }));

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the remaining room invitations', () => {
        expect(res._getData()).toEqual({ invitations: mappedInvitations });
      });

      it('should have called mailService.sendRoomInvitationDeletionNotificationEmail', () => {
        sinon.assert.calledWith(mailService.sendRoomInvitationDeletionNotificationEmail, {
          roomName: 'my room',
          ownerName: 'dagobert-the-third',
          email: 'max.mustermann@gtest.com'
        });
      });
    });
  });
});
