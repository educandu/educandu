/* eslint-disable max-lines */
import sinon from 'sinon';
import httpErrors from 'http-errors';
import uniqueId from '../utils/unique-id.js';
import RevisionController from './revision-controller.js';

const { NotFound, Forbidden } = httpErrors;

describe('document-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let documentService;
  let pageRenderer;
  let roomService;

  let revision;
  let user;
  let room;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getDocumentRevisionById: sandbox.stub()
    };

    roomService = {
      getRoomById: sandbox.stub()
    };

    clientDataMappingService = {
      mapDocOrRevision: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    res = {};
    user = { _id: uniqueId.create() };
    room = { _id: uniqueId.create() };
    revision = { _id: uniqueId.create(), slug: '', sections: [] };

    sut = new RevisionController(documentService, roomService, clientDataMappingService, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetRevisionPage', () => {
    let mappedRevision;

    beforeEach(() => {
      mappedRevision = { ...revision };
    });

    describe('when the revision does not exist', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetRevisionPage(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the revision is accessed anonymously', () => {
      beforeEach(() => {
        req = { params: { 0: '', id: revision._id } };

        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });

    describe('when the revision is of a document belonging to a room that the user is not owner or member of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.owner = uniqueId.create();
        room.members = [];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
      });

      it('should throw Forbidden', async () => {
        await expect(() => sut.handleGetRevisionPage(req, res)).rejects.toThrow(Forbidden);
      });
    });

    describe('when the revision is of a document belonging to a room that the user is owner of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.owner = user._id;
        room.members = [];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });

    describe('when the revision is of a document belonging to a room that the user is member of', () => {
      beforeEach(() => {
        req = { user, params: { 0: '', id: revision._id } };

        revision.roomId = room._id;
        room.owner = uniqueId.create();
        room.members = [{ userId: user._id }];

        roomService.getRoomById.withArgs(room._id).resolves(room);
        documentService.getDocumentRevisionById.withArgs(revision._id).resolves(revision);
        clientDataMappingService.mapDocOrRevision.withArgs(revision).resolves(mappedRevision);

        return sut.handleGetRevisionPage(req, {});
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'revision', { revision: mappedRevision });
      });
    });
  });

});
