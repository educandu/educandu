/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import permissions from '../domain/permissions.js';
import DocumentController from './document-controller.js';
import { DOCUMENT_ORIGIN, ROOM_ACCESS, ROOM_DOCUMENTS_MODE } from '../domain/constants.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

describe('document-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let documentService;
  let pageRenderer;
  let roomService;

  let user;
  let room;
  let doc;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      createDocument: sandbox.stub(),
      getDocumentById: sandbox.stub(),
      hardDeleteDocument: sandbox.stub()
    };

    roomService = {
      getRoomById: sandbox.stub()
    };

    clientDataMappingService = {
      mapRoom: sandbox.stub(),
      mapDocOrRevision: sandbox.stub(),
      mapDocsOrRevisions: sandbox.stub(),
      createProposedSections: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    room = { _id: uniqueId.create() };
    doc = { _id: uniqueId.create(), slug: '', sections: [] };

    sut = new DocumentController(documentService, roomService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetDocPage', () => {
    let mappedRoom;
    let mappedDocument;
    let templateSections;
    let templateDocument;
    let mappedTemplateDocument;

    describe('when the document does not exist', () => {
      beforeEach(() => {
        req = {
          user,
          params: { 0: '', documentId: doc._id },
          query: {}
        };

        documentService.getDocumentById.withArgs(doc._id).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the document slug is different than the URL slug', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = {
          user,
          params: { 0: '/other-slug', documentId: doc._id },
          query: { view: 'edit', templateDocumentId: uniqueId.create() }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.slug = 'doc-slug';

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);

        sut.handleGetDocPage(req, res).catch(reject);
      }));

      it('should redirect to the correct document url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl())
          .toBe(`/docs/${doc._id}/${doc.slug}?view=${req.query.view}&templateDocumentId=${req.query.templateDocumentId}`);
      });
    });

    describe('when the template document does not exist', () => {
      beforeEach(() => {
        req = {
          user,
          params: { 0: '', documentId: doc._id },
          query: { templateDocumentId: uniqueId.create() }
        };

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(req.query.templateDocumentId).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the template document exists but the document already contains sections', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { templateDocumentId: templateDocument._id }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.slug = 'doc-slug';
        doc.sections = [{}];

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        sut.handleGetDocPage(req, res).catch(reject);
      }));

      it('should redirect to the original document url', () => {
        expect(res.statusCode).toBe(302);
        expect(res._getRedirectUrl()).toBe(`/docs/${doc._id}/${doc.slug}`);
      });
    });

    describe('when the view query param is not \'edit\'', () => {
      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'other', templateDocumentId: templateDocument._id }
        };
        res = {};

        doc.slug = 'doc-slug';

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);
        clientDataMappingService.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMappingService.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMappingService.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: null, templateSections });
      });
    });

    describe('when the document belongs to a public room', () => {
      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'view', templateDocumentId: templateDocument._id }
        };
        res = {};

        doc.slug = 'doc-slug';
        doc.roomId = room._id;
        room.access = ROOM_ACCESS.public;

        templateSections = [{}];
        mappedRoom = { ...room };
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);
        clientDataMappingService.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapRoom', () => {
        sinon.assert.calledWith(clientDataMappingService.mapRoom, room, user);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMappingService.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMappingService.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: mappedRoom, templateSections });
      });
    });

    describe('when the document belongs to a private room and the user is not a room owner or member', () => {
      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'view', templateDocumentId: templateDocument._id }
        };
        res = {};

        doc.slug = 'doc-slug';
        doc.roomId = room._id;
        room.access = ROOM_ACCESS.private;
        room.owner = uniqueId.create();
        room.members = [];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);
        pageRenderer.sendPage.resolves();
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(Forbidden);
      });
    });

    describe('when the document belongs to a private room and the user is the room owner', () => {
      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'view', templateDocumentId: templateDocument._id }
        };
        res = {};

        doc.slug = 'doc-slug';
        doc.roomId = room._id;
        room.access = ROOM_ACCESS.private;
        room.owner = user._id;
        room.members = [];

        templateSections = [{}];
        mappedRoom = { ...room };
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);
        clientDataMappingService.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: mappedRoom, templateSections });
      });
    });

    describe('when the document belongs to a private room and the user is a room member', () => {
      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'view', templateDocumentId: templateDocument._id }
        };
        res = {};

        doc.slug = 'doc-slug';
        doc.roomId = room._id;
        room.access = ROOM_ACCESS.private;
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];

        templateSections = [{}];
        mappedRoom = { ...room };
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapRoom.resolves(mappedRoom);
        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);
        clientDataMappingService.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: mappedRoom, templateSections });
      });
    });

    describe('when the view query param is \'edit\'', () => {
      let documentRevision;

      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'edit', templateDocumentId: templateDocument._id }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);

        clientDataMappingService.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMappingService.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMappingService.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: null, templateSections });
      });
    });

    describe('when the view query param is \'edit\' but no templateDocumentId is provided', () => {
      let documentRevision;

      beforeEach(() => {
        templateDocument = { _id: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', documentId: doc._id },
          query: { view: 'edit' }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        mappedDocument = { ...doc };

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.getDocumentById.withArgs(templateDocument._id).resolves(templateDocument);

        clientDataMappingService.mapDocsOrRevisions.resolves([mappedDocument, null]);

        pageRenderer.sendPage.resolves();

        return sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, null], user);
      });

      it('should not call clientDataMappingService.createProposedSections', () => {
        sinon.assert.notCalled(clientDataMappingService.createProposedSections);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, room: null, templateSections: [] });
      });
    });
  });

  describe('handlePostDocument', () => {
    describe('when the roomId is unknown', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };

        roomService.getRoomById.withArgs(room._id).resolves(null);
      });

      it('should throw BadRequest', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when the user neither owns nor is not a collaborator of the room to contain the document', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        room.members = [{ userId: uniqueId.create() }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a member of the (exclusive) room to contain the document', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        room.members = [{ userId: user._id }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user owns the room to contain the document', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        room.members = [{ userId: uniqueId.create() }];

        doc.roomId = room._id;
        newDoc = { ...doc };
        mappedDoc = { ...doc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the document', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the document', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });

    describe('when the user is a collaborator of the room to contain the document', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        room.members = [{ userId: user._id }];

        doc.roomId = room._id;
        newDoc = { ...doc };
        mappedDoc = { ...doc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the document', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the document', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });

    describe('when the document does not belong to a room', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        doc = { title: 'title', slug: 'slug', language: 'language' };
        newDoc = { ...doc };
        mappedDoc = { ...mappedDoc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the document', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the document', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });
  });

  describe('handlePostDocument', () => {
    describe('when the roomId is unknown', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };

        roomService.getRoomById.withArgs(room._id).resolves(null);
      });

      it('should throw BadRequest', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when the user neither owns nor is not a collaborator of the room to contain the doc', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        room.members = [{ userId: uniqueId.create() }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user is a member of the (exclusive) room to contain the doc', () => {
      beforeEach(() => {
        req = { user, body: { roomId: room._id } };
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        room.members = [{ userId: user._id }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handlePostDocument(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the user owns the room to contain the doc', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = user._id;
        room.documentsMode = ROOM_DOCUMENTS_MODE.exclusive;
        room.members = [{ userId: uniqueId.create() }];
        doc.roomId = room._id;
        newDoc = { ...doc };
        mappedDoc = { ...doc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the doc', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the doc', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });

    describe('when the user is a collaborator of the room to contain the doc', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        room.owner = uniqueId.create();
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;
        room.members = [{ userId: user._id }];
        doc.roomId = room._id;
        newDoc = { ...doc };
        mappedDoc = { ...doc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the doc', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the doc', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });

    describe('when the doc does not belong to a room', () => {
      let newDoc;
      let mappedDoc;

      beforeEach(() => new Promise((resolve, reject) => {
        newDoc = { ...doc };
        mappedDoc = { ...doc };

        req = { user, body: doc };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        documentService.createDocument.resolves(newDoc);
        clientDataMappingService.mapDocOrRevision.resolves(mappedDoc);

        sut.handlePostDocument(req, res).catch(reject);
      }));

      it('should create the doc', () => {
        sinon.assert.calledWith(documentService.createDocument, { data: doc, user });
      });

      it('should return the doc', () => {
        expect(res.statusCode).toBe(201);
        expect(res._getData()).toBe(mappedDoc);
      });
    });
  });

  describe('handleDeleteDoc', () => {
    describe('when the documentId is unknown', () => {
      beforeEach(() => {
        req = { user, params: { documentId: doc._id } };

        documentService.getDocumentById.withArgs(doc._id).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(sut.handleDeleteDoc(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the document is internal', () => {
      beforeEach(() => {
        req = { user, params: { documentId: doc._id } };

        doc.origin = DOCUMENT_ORIGIN.internal;
        user.permissions = [permissions.MANAGE_IMPORT];

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handleDeleteDoc(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the document is external and the user has the right permissions', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, params: { documentId: doc._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.origin = `${DOCUMENT_ORIGIN.external}/educandu`;
        user.permissions = [permissions.MANAGE_IMPORT];

        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.hardDeleteDocument.resolves();

        sut.handleDeleteDoc(req, res).catch(reject);
      }));

      it('should call documentService.hardDeleteDocument', () => {
        sinon.assert.calledWith(documentService.hardDeleteDocument, doc._id);
      });
    });

    describe('when the document belongs to a room of which the user is not owner or collaborator', () => {
      beforeEach(() => {
        req = { user, params: { documentId: doc._id } };

        doc.roomId = room._id;
        doc.origin = DOCUMENT_ORIGIN.internal;
        room.owner = uniqueId.create();
        room.members = [{ userId: uniqueId.create() }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
      });

      it('should throw Forbidden', async () => {
        await expect(sut.handleDeleteDoc(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the document belongs to a room of which the user is owner', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, params: { documentId: doc._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.roomId = room._id;
        doc.origin = DOCUMENT_ORIGIN.internal;

        room.owner = user._id;
        room.members = [{ userId: uniqueId.create() }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.hardDeleteDocument.resolves();

        sut.handleDeleteDoc(req, res).catch(reject);
      }));

      it('should call documentService.hardDeleteDocument', () => {
        sinon.assert.calledWith(documentService.hardDeleteDocument, doc._id);
      });
    });

    describe('when the document belongs to a room of which the user is collaborator', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = { user, params: { documentId: doc._id } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.roomId = room._id;
        doc.origin = DOCUMENT_ORIGIN.internal;

        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];
        room.documentsMode = ROOM_DOCUMENTS_MODE.collaborative;

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentById.withArgs(doc._id).resolves(doc);
        documentService.hardDeleteDocument.resolves();

        sut.handleDeleteDoc(req, res).catch(reject);
      }));

      it('should call documentService.hardDeleteDocument', () => {
        sinon.assert.calledWith(documentService.hardDeleteDocument, doc._id);
      });
    });
  });

});
