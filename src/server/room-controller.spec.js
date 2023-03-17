import httpErrors from 'http-errors';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import cloneDeep from '../utils/clone-deep.js';
import RoomController from './room-controller.js';
import { PAGE_NAME } from '../domain/page-name.js';
import { ROOM_USER_ROLE } from '../domain/constants.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const { NotFound, Forbidden, BadRequest, Unauthorized } = httpErrors;

describe('room-controller', () => {
  const sandbox = createSandbox();

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
      createOrUpdateInvitations: sandbox.stub(),
      confirmInvitation: sandbox.stub(),
      getRoomsOwnedByUser: sandbox.stub(),
      getRoomsOwnedOrJoinedByUser: sandbox.stub(),
      getRoomsByOwnerOrCollaboratorUser: sandbox.stub(),
      getRoomById: sandbox.stub(),
      getRoomInvitationById: sandbox.stub(),
      isRoomOwnerOrMember: sandbox.stub(),
      getRoomInvitations: sandbox.stub(),
      createRoom: sandbox.stub(),
      updateRoomMetadata: sandbox.stub(),
      updateRoomDocumentsOrder: sandbox.stub(),
      removeRoomMember: sandbox.stub(),
      deleteRoomInvitation: sandbox.stub(),
      createRoomMessage: sandbox.stub(),
      deleteRoomMessage: sandbox.stub()
    };
    documentService = {
      getDocumentsExtendedMetadataByIds: sandbox.stub()
    };
    userService = {
      getUserById: sandbox.stub()
    };
    storageService = {
      deleteRoomAndResources: sandbox.stub()
    };
    mailService = {
      sendRoomInvitationEmails: sandbox.stub(),
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
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        const room = { _id: uniqueId.create() };
        mappedRoom = cloneDeep(room);

        roomService.getRoomsOwnedByUser.resolves([room]);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = { user, query: { userRole: ROOM_USER_ROLE.owner } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRooms(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned rooms', () => {
        expect(res._getData()).toEqual({ rooms: [mappedRoom] });
      });
    });

    describe('when called with user role "ownerOrMember"', () => {
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        const room = { _id: uniqueId.create() };
        mappedRoom = cloneDeep(room);

        roomService.getRoomsOwnedOrJoinedByUser.resolves([room]);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = { user, query: { userRole: ROOM_USER_ROLE.ownerOrMember } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRooms(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned/joined rooms', () => {
        expect(res._getData()).toEqual({ rooms: [mappedRoom] });
      });
    });

    describe('when called with user role "ownerOrCollaborator"', () => {
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        const room = { _id: uniqueId.create() };
        mappedRoom = cloneDeep(room);

        roomService.getRoomsByOwnerOrCollaboratorUser.resolves([room]);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = { user, query: { userRole: ROOM_USER_ROLE.ownerOrCollaborator } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRooms(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned/collaborated rooms', () => {
        expect(res._getData()).toEqual({ rooms: [mappedRoom] });
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

  describe('handleGetRoom', () => {

    describe('when called as an owner', () => {
      let roomId;
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        roomId = uniqueId.create();
        const room = { _id: roomId, isCollaborative: true, owner: user._id, members: [] };
        mappedRoom = cloneDeep(room);

        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapRoom.withArgs({ room, viewingUser: user }).resolves(mappedRoom);

        req = { user, params: { roomId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRoom(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });
    });

    describe('when called as a collaborative member', () => {
      let roomId;
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        roomId = uniqueId.create();
        const room = { _id: roomId, isCollaborative: true, owner: 'some-other-user', members: [{ userId: user._id }] };
        mappedRoom = cloneDeep(room);

        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapRoom.withArgs({ room, viewingUser: user }).resolves(mappedRoom);

        req = { user, params: { roomId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRoom(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });
    });

    describe('when called as a non-collaborative member', () => {
      let roomId;
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        roomId = uniqueId.create();
        const room = { _id: roomId, isCollaborative: false, owner: 'some-other-user', members: [{ userId: user._id }] };
        mappedRoom = cloneDeep(room);

        roomService.getRoomById.withArgs(roomId).resolves(room);
        clientDataMappingService.mapRoom.withArgs({ room, viewingUser: user }).resolves(mappedRoom);

        req = { user, params: { roomId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleGetRoom(req, res).catch(reject);
      }));

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the owned room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });
    });

    describe('when called for a non-existing room', () => {
      beforeEach(() => {
        const roomId = uniqueId.create();
        roomService.getRoomById.withArgs(roomId).resolves(null);

        req = { user, params: { roomId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetRoom(req, res)).rejects.toThrow(NotFound);
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
          body: { name: 'name', slug: 'slug', isCollaborative: false }
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
          isCollaborative: false,
          description: 'description'
        };
        requestBody = {
          name: 'new name',
          slug: 'new-slug',
          description: 'new description',
          isCollaborative: true
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
        assert.calledWith(roomService.updateRoomMetadata, room._id, { ...requestBody });
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room: updatedRoom, viewingUser: user });
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
          isCollaborative: false
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
          isCollaborative: true,
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
        assert.calledWith(roomService.updateRoomDocumentsOrder, room._id, requestBody.documentIds);
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room: updatedRoom, viewingUser: user });
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
          isCollaborative: false,
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
          isCollaborative: true,
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

    describe('when the request data has two valid email addresses', () => {
      const room = { roomId: uniqueId.create(), name: 'Mein schöner Raum' };
      const invitation1 = { email: 'invited-1@user.com', token: '94zv87nt2zztc8m3zt2z3845z8txc' };
      const invitation2 = { email: 'invited-2@user.com', token: '483ztn72c837nco47n7to484878dh' };

      beforeEach(() => new Promise((resolve, reject) => {
        roomService.createOrUpdateInvitations.resolves({
          room,
          owner: user,
          invitations: [invitation1, invitation2]
        });
        mailService.sendRoomInvitationEmails.resolves();

        req = httpMocks.createRequest({
          protocol: 'https',
          headers: { host: 'educandu.dev' },
          body: { roomId: '843zvnzn2vw', emails: ['invited-1@user.com', 'invited-2@user.com'] }
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
        expect(res._getData()).toEqual([invitation1, invitation2]);
      });

      it('should have called roomService.createOrUpdateInvitations', () => {
        assert.calledWith(roomService.createOrUpdateInvitations, {
          roomId: '843zvnzn2vw',
          emails: ['invited-1@user.com', 'invited-2@user.com'],
          user
        });
      });

      it('should have called mailService.sendRoomInvitationEmails', () => {
        assert.calledWith(mailService.sendRoomInvitationEmails, {
          roomName: 'Mein schöner Raum',
          ownerName: 'dagobert-the-third',
          invitations: [invitation1, invitation2]
        });
      });
    });

    describe('when the request data is invalid and causes a BadRequest', () => {
      beforeEach(() => {
        roomService.createOrUpdateInvitations.returns(Promise.reject(new BadRequest()));

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
      roomService.createOrUpdateInvitations.resolves({
        room,
        owner: user,
        invitations: [invitation]
      });
      mailService.sendRoomInvitationEmails.resolves();

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
        isCollaborative: false,
        documents: [uniqueId.create(), uniqueId.create()]
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
      let viewingUser;
      let mappedInvitations;

      beforeEach(async () => {
        viewingUser = { _id: 'owner' };
        request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: viewingUser
        };

        documents = [
          { _id: room.documents[0], roomContext: { draft: false } },
          { _id: room.documents[1], roomContext: { draft: true } }
        ];
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
        assert.calledWith(roomService.getRoomById, room._id);
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room, viewingUser });
      });

      it('should call getRoomInvitations', () => {
        assert.calledWith(roomService.getRoomInvitations, room._id);
      });

      it('should call mapRoomInvitations with the invitations returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoomInvitations, invitations);
      });

      it('should call getDocumentsExtendedMetadataByIds', () => {
        assert.calledWith(documentService.getDocumentsExtendedMetadataByIds, room.documents);
      });

      it('should call mapDocsOrRevisions with the documents returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents);
      });

      it('should call pageRenderer with the right parameters', () => {
        assert.calledWith(
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
      let viewingUser;
      let mappedInvitations;

      beforeEach(async () => {
        viewingUser = { _id: 'member' };
        request = {
          params: { 0: `/${room.slug}`, roomId: room._id },
          user: viewingUser
        };

        documents = [
          { _id: room.documents[0], roomContext: { draft: false } },
          { _id: room.documents[1], roomContext: { draft: true } }
        ];
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
        assert.calledWith(roomService.getRoomById, room._id);
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room, viewingUser });
      });

      it('should not call getRoomInvitations', () => {
        assert.notCalled(roomService.getRoomInvitations);
      });

      it('should call getDocumentsExtendedMetadataByIds', () => {
        assert.calledWith(documentService.getDocumentsExtendedMetadataByIds, room.documents);
      });

      it('should call mapDocsOrRevisions with the documents returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapDocsOrRevisions, documents);
      });

      it('should call pageRenderer with the right parameters', () => {
        assert.calledWith(
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
        assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
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
        assert.calledWith(roomService.isRoomOwnerOrMember, roomId, user._id);
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

        sut.handleDeleteRoomsForUser(req, res).catch(reject);
      }));

      it('should call storageService.deleteRoomAndResources for each room', () => {
        assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomA._id, roomOwnerId: user._id });
        assert.calledWith(storageService.deleteRoomAndResources, { roomId: roomB._id, roomOwnerId: user._id });
      });

      it('should call mailService.sendRoomDeletionNotificationEmails for each room', () => {
        assert.calledWith(
          mailService.sendRoomDeletionNotificationEmails,
          { roomName: roomA.name, ownerName: user.displayName, roomMembers: roomA.members }
        );
        assert.calledWith(
          mailService.sendRoomDeletionNotificationEmails,
          { roomName: roomB.name, ownerName: user.displayName, roomMembers: roomB.members }
        );
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

        sut.handleDeleteRoomsForUser(req, res).catch(reject);
      }));

      it('should not call storageService.deleteRoomAndResources', () => {
        assert.notCalled(storageService.deleteRoomAndResources);
      });

      it('should not call mailService.sendRoomDeletionNotificationEmails', () => {
        assert.notCalled(mailService.sendRoomDeletionNotificationEmails);
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
        assert.calledWith(storageService.deleteRoomAndResources, { roomId: room._id, roomOwnerId: user._id });
      });

      it('should call mailService.sendRoomDeletionNotificationEmails with the right emails', () => {
        assert.calledWith(
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
        clientDataMappingService.mapRoom.withArgs({ room: updatedRoom, viewingUser: user }).resolves(mappedRoom);
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
        assert.calledWith(mailService.sendRoomMemberRemovalNotificationEmail, {
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
        clientDataMappingService.mapRoom.withArgs({ room: updatedRoom, viewingUser: memberUser }).resolves(mappedRoom);
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
        assert.notCalled(mailService.sendRoomMemberRemovalNotificationEmail);
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
        assert.calledWith(mailService.sendRoomInvitationDeletionNotificationEmail, {
          roomName: 'my room',
          ownerName: 'dagobert-the-third',
          email: 'max.mustermann@gtest.com'
        });
      });
    });
  });

  describe('handlePostRoomMessage', () => {
    let room;

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        room = {
          _id: uniqueId.create(),
          name: 'Raum',
          slug: 'room-slug',
          owner: 'other-user',
          isCollaborative: false,
          members: [],
          messages: [],
          documents: []
        };

        roomService.getRoomById.resolves(room);

        req = {
          user,
          params: { roomId: room._id },
          body: { text: 'message text', emailNotification: false }
        };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handlePostRoomMessage(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the request is valid', () => {
      let updatedRoom;
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          name: 'Raum',
          slug: 'room-slug',
          owner: user._id,
          isCollaborative: false,
          members: [],
          messages: [],
          documents: []
        };
        updatedRoom = cloneDeep(room);
        mappedRoom = cloneDeep(updatedRoom);

        roomService.getRoomById.resolves(room);
        roomService.createRoomMessage.resolves(updatedRoom);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = {
          user,
          params: { roomId: room._id },
          body: { text: 'message text', emailNotification: false }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePostRoomMessage(req, res).catch(reject);
      }));

      it('should call roomService.createRoomMessage', () => {
        assert.calledWith(roomService.createRoomMessage, { room, ...req.body });
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room: updatedRoom, viewingUser: user });
      });

      it('should respond with status code 201', () => {
        expect(res.statusCode).toBe(201);
      });

      it('should respond with the mapped updated room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });
    });
  });

  describe('handleDeleteRoomMessage', () => {
    let room;

    describe('when the user is not the room owner', () => {
      beforeEach(() => {
        room = {
          _id: uniqueId.create(),
          name: 'Raum',
          slug: 'room-slug',
          owner: 'other-user',
          isCollaborative: false,
          members: [],
          messages: [
            {
              key: uniqueId.create()
            }
          ],
          documents: []
        };

        roomService.getRoomById.resolves(room);

        req = {
          user,
          params: { roomId: room._id, messageKey: room.messages[0].key }
        };
        res = {};
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleDeleteRoomMessage(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the request is valid', () => {
      let updatedRoom;
      let mappedRoom;

      beforeEach(() => new Promise((resolve, reject) => {
        room = {
          _id: uniqueId.create(),
          name: 'Raum',
          slug: 'room-slug',
          owner: user._id,
          isCollaborative: false,
          members: [],
          messages: [
            {
              key: uniqueId.create()
            }
          ],
          documents: []
        };
        updatedRoom = cloneDeep(room);
        mappedRoom = cloneDeep(updatedRoom);

        roomService.getRoomById.resolves(room);
        roomService.deleteRoomMessage.resolves(updatedRoom);
        clientDataMappingService.mapRoom.resolves(mappedRoom);

        req = {
          user,
          params: { roomId: room._id, messageKey: room.messages[0].key }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteRoomMessage(req, res).catch(reject);
      }));

      it('should call roomService.deleteRoomMessage', () => {
        assert.calledWith(roomService.deleteRoomMessage, { room, messageKey: req.params.messageKey });
      });

      it('should call mapRoom with the room returned by the service', () => {
        assert.calledWith(clientDataMappingService.mapRoom, { room: updatedRoom, viewingUser: user });
      });

      it('should respond with status code 200', () => {
        expect(res.statusCode).toBe(200);
      });

      it('should respond with the mapped updated room', () => {
        expect(res._getData()).toEqual({ room: mappedRoom });
      });
    });
  });
});
