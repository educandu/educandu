import httpErrors from 'http-errors';
import httpMocks from 'node-mocks-http';
import { EventEmitter } from 'node:events';
import uniqueId from '../utils/unique-id.js';
import { assert, createSandbox } from 'sinon';
import cloneDeep from '../utils/clone-deep.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DocumentCommentController from './document-comment-controller.js';

const { NotFound, BadRequest } = httpErrors;

describe('document-comment-controller', () => {
  const sandbox = createSandbox();

  let clientDataMappingService;
  let documentCommentService;
  let documentService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentCommentService = {
      createDocumentComment: sandbox.stub(),
      deleteDocumentComment: sandbox.stub(),
      getDocumentCommentById: sandbox.stub(),
      getAllDocumentComments: sandbox.stub()
    };
    documentService = {
      getDocumentById: sandbox.stub()
    };
    clientDataMappingService = {
      mapDocumentComment: sandbox.stub(),
      mapDocumentComments: sandbox.stub()
    };

    user = {
      _id: uniqueId.create(),
      displayName: 'Test'
    };

    sut = new DocumentCommentController(documentCommentService, documentService, clientDataMappingService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetDocumentComments', () => {
    let documentId;
    let documentComments;
    let mappedDocumentComments;

    beforeEach(() => new Promise((resolve, reject) => {
      documentId = uniqueId.create();
      documentComments = [
        {
          documentId,
          _id: uniqueId.create(),
          topic: 'comment-topic-1',
          text: 'comment-text-1'
        },
        {
          documentId,
          _id: uniqueId.create(),
          topic: 'comment-topic-2',
          text: 'comment-text-2'
        }
      ];
      mappedDocumentComments = cloneDeep(documentComments);

      documentCommentService.getAllDocumentComments.resolves(documentComments);
      clientDataMappingService.mapDocumentComments.resolves(mappedDocumentComments);

      req = { user, query: { documentId } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handleGetDocumentComments(req, res).catch(reject);
    }));

    it('should call documentCommentService.getAllDocumentComments', () => {
      assert.calledWith(documentCommentService.getAllDocumentComments, documentId);
    });

    it('should call clientDataMappingService.mapDocumentComments', () => {
      assert.calledWith(clientDataMappingService.mapDocumentComments, documentComments);
    });

    it('should return the mapped comments', () => {
      expect(res._getData()).toEqual({ documentComments: mappedDocumentComments });
    });
  });

  describe('handlePutDocumentComment', () => {
    let data;
    let documentId;
    let documentComment;
    let mappedDocumentComment;

    describe('when the request contains an unknown document id', () => {
      beforeEach(() => {
        documentId = uniqueId.create();
        documentService.getDocumentById.withArgs(documentId).resolves(null);

        req = { user, body: { documentId } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePutDocumentComment(req, res)).rejects.toThrow(BadRequest);
      });
    });

    describe('when the payload is correct', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        documentId = uniqueId.create();
        data = {
          documentId,
          topic: 'comment-topic-1',
          text: 'comment-text-1'
        };
        documentComment = cloneDeep(data);
        mappedDocumentComment = cloneDeep(documentComment);

        documentService.getDocumentById.resolves({});
        documentCommentService.createDocumentComment.resolves(documentComment);
        clientDataMappingService.mapDocumentComment.resolves(mappedDocumentComment);

        req = { user, body: { ...data } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePutDocumentComment(req, res).catch(reject);
      }));

      it('should call documentService.getDocumentById', () => {
        assert.calledWith(documentService.getDocumentById, documentId);
      });

      it('should call documentCommentService.createDocumentComment', () => {
        assert.calledWith(documentCommentService.createDocumentComment, { data, user });
      });

      it('should call clientDataMappingService.mapDocumentComment', () => {
        assert.calledWith(clientDataMappingService.mapDocumentComment, documentComment);
      });

      it('should return the mapped document comment', () => {
        expect(res._getData()).toEqual(mappedDocumentComment);
      });
    });

  });

  describe('handleDeleteDocumentComment', () => {
    describe('when the request contains an unknown document comment ID', () => {
      beforeEach(() => {
        const documentCommentId = uniqueId.create();
        documentCommentService.getDocumentCommentById.withArgs(documentCommentId).resolves(null);

        req = { user, params: { documentCommentId } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteDocumentComment(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request contains the ID of a deleted document comment', () => {
      beforeEach(() => {
        const documentCommentId = uniqueId.create();
        documentCommentService.getDocumentCommentById.withArgs(documentCommentId).resolves({ deletedOn: new Date() });

        req = { user, params: { documentCommentId } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteDocumentComment(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the payload is correct', () => {
      let documentCommentId;

      beforeEach(() => new Promise((resolve, reject) => {
        documentCommentId = uniqueId.create();
        documentCommentService.getDocumentCommentById.withArgs(documentCommentId).resolves({});
        documentCommentService.deleteDocumentComment.resolves();

        req = { user, params: { documentCommentId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteDocumentComment(req, res).catch(reject);
      }));

      it('should call documentCommentService.deleteDocumentComment', () => {
        assert.calledWith(documentCommentService.deleteDocumentComment, { documentCommentId, user });
      });
    });
  });
});
