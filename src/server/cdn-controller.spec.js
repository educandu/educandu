import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import CdnController from './cdn-controller.js';

const { BadRequest, Unauthorized } = httpErrors;

describe('cdn-controller', () => {
  const sandbox = sinon.createSandbox();

  let cdnService;
  let roomService;

  let user;
  let room;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    cdnService = {
      uploadFiles: sandbox.stub()
    };
    roomService = {
      getRoomById: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    room = { _id: uniqueId.create() };

    roomService.getRoomById.resolves(null);
    roomService.getRoomById.withArgs(room._id).resolves(room);

    sut = new CdnController(cdnService, roomService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handlePostCdnObject', () => {
    describe('when no files are provided', () => {
      beforeEach(() => {
        req = { user, files: [], body: { prefix: 'media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { prefix: 'other-path/media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but the room ID is unknown', () => {
      beforeEach(() => {
        req = { user, files: [{}], body: { prefix: 'rooms/some-room-id/media/' } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when storage path type is private but user is not the room owner', () => {
      beforeEach(() => {
        room.owner = uniqueId.create();
        req = { user, files: [{}], body: { prefix: `rooms/${room._id}/media/` } };
        res = {};
      });

      it('should throw Unauthorized', async () => {
        await expect(() => sut.handlePostCdnObject(req, res)).rejects.toThrow(Unauthorized);
      });
    });

    describe('when storage path type is private and the user is the room owner', () => {
      beforeEach(done => {
        room.owner = user._id;
        req = { user, files: [{}], body: { prefix: `rooms/${room._id}/media/` } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        sut.handlePostCdnObject(req, res);
      });

      it('should call cdnService.uploadFiles', () => {
        sinon.assert.calledWith(cdnService.uploadFiles, { prefix: req.body.prefix, files: req.files, user });
      });

      it('should return 200', () => {
        expect(res.statusCode).toBe(200);
      });
    });
  });
});
