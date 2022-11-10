/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_DOCUMENTS_MODE, ROOM_USER_ROLE } from '../domain/constants.js';

const { NotFound, Forbidden, BadRequest, Unauthorized } = httpErrors;

describe('room-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let storageService;
  let documentService;
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
      getRoomsByOwnerOrCollaboratorUser: sandbox.stub(),
      getRoomById: sandbox.stub(),
      getRoomInvitationById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub(),
      getRoomInvitations: sandbox.stub(),
      createRoom: sandbox.stub(),
      updateRoomMetadata: sandbox.stub(),
      updateRoomDocumentsOrder: sandbox.stub(),
      removeRoomMember: sandbox.stub(),
      deleteRoomInvitation: sandbox.stub()
    };
    documentService = {
      getDocumentsExtendedMetadataByIds: sandbox.stub()
    };
    userService = {
      getUserById: sandbox.stub()
    };
    storageService = {
      deleteRoomAndResources: sandbox.stub(),
      updateUserUsedBytes: sandbox.stub()
    };
    mailService = {
      sendRoomInvitationEmail: sandbox.stub(),
      sendRoomDeletionNotificationEmails: sandbox.stub(),
      sendRoomMemberRemovalNotificationEmail: sandbox.stub(),
      sendRoomInvitationDeletionNotificationEmail: sandbox.stub()
    };
    user = {
      _id: uniqueId.create(),
      displayName: 'dagobert-the-third'
    };

    clientDataMappingService = {
      mapRoom: sandbox.stub(),
      mapDocsOrRevisions: sandbox.stub(),
      mapRoomInvitations: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };
    sut = new RoomController(serverConfig, roomService, documentService, userService, storageService, mailService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetRooms', () => {

    describe('when called with user role "owner"', () => {
      const ownedRooms = Array.from({ length: 3 }, () => ({ _id: uniqueId.create() }));

      beforeEach(() => new Promise((resolve, reject) => {
        roomService.getRoomsOwnedByUser.resolves(ownedRooms);

        req = { user, query: { userRole: ROOM_USER_ROLE.owner } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRooms(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned rooms', () => {
        expect(res._getData()).toEqual(ownedRooms);
      });
    });

    describe('when called with user role "ownerOrCollaborator"', () => {
      const ownedOrCollaboratedRooms = Array.from({ length: 3 }, () => ({ _id: uniqueId.create() }));

      beforeEach(() => new Promise((resolve, reject) => {
        roomService.getRoomsByOwnerOrCollaboratorUser.resolves(ownedOrCollaboratedRooms);

        req = { user, query: { userRole: ROOM_USER_ROLE.ownerOrCollaborator } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRooms(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned/collaborated rooms', () => {
        expect(res._getData()).toEqual(ownedOrCollaboratedRooms);
      });
    });

    describe('when called with an invalid user role', () => {
      beforeEach(() => {
        req = { user, query: { userRole: 'invalid' } };
        res = httpMocks.createResponse();
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handleGetRooms(req, res)).rejects.toThrow(BadRequest);
      });
    });

  });

  describe('handlePostRoom', () => {

    describe('when the request data is valid', () => {
      const createdRoom = {};

      beforeEach(() => new Promise((resolve, reject) => {
        roomService.createRoom.resolves(createdRoom);

        req = {
          user,
          body: { name: 'name', slug: 'slug', documentsMode: ROOM_DOCUMENTS_MODE.exclusive }
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

  describe('handlePatchRoomMetadata', () => {

    describe('when the request data is valid', () => {
      let room;
      let mappedRoom;
      let requestBody;
      let updatedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          owner: user._id,
          name: 'name',
          slug: 'slug',
          documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
          description: 'description'
        };
        requestBody = {
          name: 'new name',
          slug: 'new-slug',
          description: 'new description',
          documentsMode: ROOM_DOCUMENTS_MODE.collaborative
        };
        updatedRoom = {
          ...room,
          ...requestBody
        };
        mappedRoom = cloneDeep(updatedRoom);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.updateRoomMetadata.resolves(updatedRoom);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = { user, params: { roomId: room._id }, body: { ...requestBody } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePatchRoomMetadata(req, res).catch(reject);
      }));

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call roomService.updateRoomMetadata', () => {
        sinon.assert.calledWith(roomService.updateRoomMetadata, room._id, { ...requestBody });
      });

      it('should call mapRoom with the room returned by the service', () => {
        sinon.assert.calledWith(clientDataMappingService.mapRoom, updatedRoom);
      });

      it('should respond with the updated room', () => {
        expect(res._getData()).toEqual({ room: updatedRoom });
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
        await expect(() => sut.handlePatchRoomMetadata(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request is made by a user which is not the room owner', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          documentsMode: ROOM_DOCUMENTS_MODE.exclusive
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = { user, params: { roomId: room._id }, body: { name: 'new name', slug: 'new-slug' } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchRoomMetadata(req, res)).rejects.toThrow(Forbidden);
      });
    });
  });

  describe('handlePatchRoomDocuments', () => {

    describe('when the request data is valid, posted by a room collaborator', () => {
      let room;
      let mappedRoom;
      let requestBody;
      let updatedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
          description: 'description',
          members: [{ userId: user._id }],
          documents: []
        };
        requestBody = {
          documentIds: [uniqueId.create()]
        };
        updatedRoom = {
          ...room,
          ...requestBody
        };
        mappedRoom = cloneDeep(updatedRoom);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        roomService.updateRoomDocumentsOrder.resolves(updatedRoom);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = { user, params: { roomId: room._id }, body: { ...requestBody } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePatchRoomDocuments(req, res).catch(reject);
      }));

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should call roomService.updateRoomDocumentsOrder', () => {
        sinon.assert.calledWith(roomService.updateRoomDocumentsOrder, room._id, requestBody.documentIds);
      });

      it('should call mapRoom with the room returned by the service', () => {
        sinon.assert.calledWith(clientDataMappingService.mapRoom, updatedRoom);
      });

      it('should respond with the updated room', () => {
        expect(res._getData()).toEqual({ room: updatedRoom });
      });
    });

    describe('when the request contains an unknown room id', () => {
      beforeEach(() => {
        const roomId = uniqueId.create();

        roomService.getRoomById.withArgs(roomId).resolves(null);

        req = { user, params: { roomId }, body: { documents: [] } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handlePatchRoomDocuments(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request is made by a user which is not the room owner', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
          members: [{ userId: uniqueId.create() }]
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = { user, params: { roomId: room._id }, body: { documents: [] } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchRoomDocuments(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the request is made by a user which is not a room collaborator', () => {
      beforeEach(() => {
        const room = {
          _id: uniqueId.create(),
          owner: uniqueId.create(),
          name: 'name',
          slug: 'slug',
          documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
          members: [{ userId: uniqueId.create() }]
        };

        roomService.getRoomById.withArgs(room._id).resolves(room);

        req = { user, params: { roomId: room._id }, body: { documents: [] } };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePatchRoomDocuments(req, res)).rejects.toThrow(Forbidden);
      });
    });
  });

  describe('handlePostRoomInvitations', () => {

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
          body: { roomId: '843zvnzn2vw', emails: ['invited@user.com'] }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePostRoomInvitations(req, res).catch(reject);
      }));

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should respond with the created/updated invitations', () => {
        expect(res._getData()).toEqual([invitation]);
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
          body: { roomId: '843zvnzn2vw', emails: ['invited@user.com'] }
        });
        req.user = user;

        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should propagate the error', async () => {
        await expect(() => sut.handlePostRoomInvitations(req, res)).rejects.toThrow(BadRequest);
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
    let room;
    let request;
    let mappedRoom;
    let mappedDocuments;

    beforeEach(() => {
      room = {
        _id: uniqueId.create(),
        name: 'Mein schöner Raum',
        slug: 'room-slug',
        owner: 'owner',
        documentsMode: ROOM_DOCUMENTS_MODE.exclusive,
        documents: [uniqueId.create()]
      };
      mappedRoom = { ...room };
    });

    describe('when user is not provided (session expired)', () => {
      beforeEach(() => {
        roomService.getRoomById.resolves(room);

        req = { params: { 0: `/${room.slug}`, roomId: room._id } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handleGetRoomPage(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when the request is made by the room owner', () => {
      let documents;
      let invitations;
      let mappedInvitations;

      beforeEach(async () => {
        request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'owner' }
        };

        documents = [{ _id: room.documents[0] }];
        invitations = [{ email: 'test@test.com', sentOn: new Date() }];

        mappedDocuments = cloneDeep(documents);
        mappedInvitations = [{ email: 'test@test.com', sentOn: new Date().toISOString() }];

        roomService.getRoomById.resolves(room);
        roomService.isRoomOwnerOrMember.resolves(true);

        documentService.getDocumentsExtendedMetadataByIds.resolves(documents);
        roomService.getRoomInvitations.resolves(invitations);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapDocsOrRevisions.returns(mappedDocuments);
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

      it('should call getDocumentsExtendedMetadataByIds', () => {
        sinon.assert.calledWith(documentService.getDocumentsExtendedMetadataByIds, room.documents);
      });

      it('should call mapDocsOrRevisions with the invitations returned by the service', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(
          pageRenderer.sendPage,
          request,
          {},
          PAGE_NAME.room,
          { room: mappedRoom, documents: mappedDocuments, invitations: mappedInvitations }
        );
      });
    });

    describe('when the request is made by a room member', () => {
      let documents;
      let mappedInvitations;

      beforeEach(async () => {
        request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'member' }
        };

        documents = [{ _id: room.documents[0] }];
        mappedDocuments = cloneDeep(documents);
        mappedInvitations = [];

        roomService.getRoomById.resolves(room);
        roomService.isRoomOwnerOrMember.resolves(true);
        documentService.getDocumentsExtendedMetadataByIds.resolves(documents);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapDocsOrRevisions.returns(mappedDocuments);
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

      it('should call getDocumentsExtendedMetadataByIds', () => {
        sinon.assert.calledWith(documentService.getDocumentsExtendedMetadataByIds, room.documents);
      });

      it('should call mapDocsOrRevisions with the invitations returned by the service', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents);
      });

      it('should call pageRenderer with the right parameters', () => {
        sinon.assert.calledWith(
          pageRenderer.sendPage,
          request,
          {},
          PAGE_NAME.room,
          { room: mappedRoom, documents: mappedDocuments, invitations: mappedInvitations }
        );
      });
    });

    describe('when the request is mabe by an unauthorized user', () => {
      beforeEach(() => {
        request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: { _id: 'randomGuy' }
        };

        roomService.getRoomById.resolves(room);
        roomService.isRoomOwnerOrMember.resolves(false);
      });

      it('should throw a forbidden exception', async () => {
        await expect(() => sut.handleGetRoomPage(request, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the room does not exist', () => {
      it('should throw a not found exception', async () => {
        await expect(() => sut.handleGetRoomPage({ params: { 0: '', roomId: 'abc' } })).rejects.toThrow(NotFound);
      });
    });

    describe('when the room slug is different than the URL slug', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          name: 'Mein schöner Raum',
          slug: 'room-slug'
        };

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
    describe('when user has rooms', () => {
      const userJacky = [{ _id: uniqueId.create(), email: 'jacky@test.com' }];
      const userClare = [{ _id: uniqueId.create(), email: 'clare@test.com' }];
      const userDrake = [{ _id: uniqueId.create(), email: 'drake@test.com' }];
      const roomA = { _id: uniqueId.create(), name: 'Room A', members: [{ userId: userJacky._id }, { userId: userClare._id }] };
      const roomB = { _id: uniqueId.create(), name: 'Room B', members: [{ userId: userClare._id }, { userId: userDrake._id }] };

      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, query: { ownerId: user._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        userService.getUserById.withArgs(user._id).resolves(user);
        roomService.getRoomsOwnedByUser.withArgs(user._id).resolves([roomA, roomB]);
        storageService.deleteRoomAndResources.resolves();
        mailService.sendRoomDeletionNotificationEmails.resolves();
        storageService.updateUserUsedBytes.resolves();

        sut.handleDeleteRoomsForUser(req, res).catch(reject);
      }));

      it('should call storageService.deleteRoomAndResources for each room', () => {
        sinon.assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomA._id, roomOwnerId: user._id });
        sinon.assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomB._id, roomOwnerId: user._id });
      });

      it('should call mailService.sendRoomDeletionNotificationEmails for each room', () => {
        sinon.assert.calledWith(
          mailService.sendRoomDeletionNotificationEmails,
          { roomName: roomA.name, ownerName: user.displayName, roomMembers: roomA.members }
        );
        sinon.assert.calledWith(
          mailService.sendRoomDeletionNotificationEmails,
          { roomName: roomB.name, ownerName: user.displayName, roomMembers: roomB.members }
        );
      });

      it('should call storageService.updateUserUsedBytes', () => {
        sinon.assert.calledWith(storageService.updateUserUsedBytes, user._id);
      });

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });
    });

    describe('when user has no rooms', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, query: { ownerId: user._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        userService.getUserById.withArgs(user._id).resolves(user);
        roomService.getRoomsOwnedByUser.withArgs(user._id).resolves([]);
        storageService.deleteRoomAndResources.resolves();
        mailService.sendRoomDeletionNotificationEmails.resolves();
        storageService.updateUserUsedBytes.resolves();

        sut.handleDeleteRoomsForUser(req, res).catch(reject);
      }));

      it('should not call storageService.deleteRoomAndResources', () => {
        sinon.assert.notCalled(storageService.deleteRoomAndResources);
      });

      it('should not call mailService.sendRoomDeletionNotificationEmails', () => {
        sinon.assert.notCalled(mailService.sendRoomDeletionNotificationEmails);
      });

      it('should call storageService.updateUserUsedBytes once to ensure the calculation is up to date', () => {
        sinon.assert.calledWith(storageService.updateUserUsedBytes, user._id);
      });

      it('should return status 200', () => {
        expect(res.statusCode).toBe(200);
      });
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
        sinon.assert.calledWith(
          mailService.sendRoomDeletionNotificationEmails,
          { roomMembers: room.members, roomName: room.name, ownerName: user.displayName }
        );
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
