import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import cloneDeep from '../utils/clone-deep.js';
import CommentController from './comment-controller.js';

const { NotFound, BadRequest } = httpErrors;

describe('comment-controller', () => {
  const sandbox = sinon.createSandbox();

  let clientDataMappingService;
  let documentService;
  let commentService;
  let user;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    commentService = {
      createComment: sandbox.stub(),
      deleteComment: sandbox.stub(),
      getCommentById: sandbox.stub(),
      getAllDocumentComments: sandbox.stub()
    };
    documentService = {
      getDocumentById: sandbox.stub()
    };
    user = {
      _id: uniqueId.create(),
      displayName: 'Test'
    };

    clientDataMappingService = {
      mapComment: sandbox.stub(),
      mapComments: sandbox.stub()
    };

    sut = new CommentController(commentService, documentService, clientDataMappingService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetDocumentComments', () => {
    let comments;
    let documentId;
    let mappedComments;

    beforeEach(() => new Promise((resolve, reject) => {
      documentId = uniqueId.create();
      comments = [
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
      mappedComments = cloneDeep(comments);

      commentService.getAllDocumentComments.resolves(comments);
      clientDataMappingService.mapComments.resolves(mappedComments);

      req = { user, query: { documentId } };
      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', resolve);

      sut.handleGetDocumentComments(req, res).catch(reject);
    }));

    it('should call commentService.getAllDocumentComments', () => {
      sinon.assert.calledWith(commentService.getAllDocumentComments, documentId);
    });

    it('should call clientDataMappingService.mapComments', () => {
      sinon.assert.calledWith(clientDataMappingService.mapComments, comments);
    });

    it('should return the mapped comments', () => {
      expect(res._getData()).toEqual({ comments: mappedComments });
    });
  });

  describe('handlePutComment', () => {
    let data;
    let comment;
    let documentId;
    let mappedComment;

    describe('when the request contains an unknown document id', () => {
      beforeEach(() => {
        documentId = uniqueId.create();
        documentService.getDocumentById.withArgs(documentId).resolves(null);

        req = { user, body: { documentId } };
        res = {};
      });

      it('should throw BadRequest', async () => {
        await expect(() => sut.handlePutComment(req, res)).rejects.toThrow(BadRequest);
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
        comment = cloneDeep(data);
        mappedComment = cloneDeep(comment);

        documentService.getDocumentById.resolves({});
        commentService.createComment.resolves(comment);
        clientDataMappingService.mapComment.resolves(mappedComment);

        req = { user, body: { ...data } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handlePutComment(req, res).catch(reject);
      }));

      it('should call documentService.getDocumentById', () => {
        sinon.assert.calledWith(documentService.getDocumentById, documentId);
      });

      it('should call commentService.createComment', () => {
        sinon.assert.calledWith(commentService.createComment, { data, user });
      });

      it('should call clientDataMappingService.mapComment', () => {
        sinon.assert.calledWith(clientDataMappingService.mapComment, comment);
      });

      it('should return the mapped comment', () => {
        expect(res._getData()).toEqual(mappedComment);
      });
    });

  });

  describe('handleDeleteComment', () => {
    describe('when the request contains an unknown comment id', () => {
      beforeEach(() => {
        const commentId = uniqueId.create();
        commentService.getCommentById.withArgs(commentId).resolves(null);

        req = { user, params: { commentId } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteComment(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the request contains the comment id of a deleted comment', () => {
      beforeEach(() => {
        const commentId = uniqueId.create();
        commentService.getCommentById.withArgs(commentId).resolves({ deletedOn: new Date() });

        req = { user, params: { commentId } };
        res = {};
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleDeleteComment(req, res)).rejects.toThrow(NotFound);
      });
    });

    describe('when the payload is correct', () => {
      let commentId;

      beforeEach(() => new Promise((resolve, reject) => {
        commentId = uniqueId.create();
        commentService.getCommentById.withArgs(commentId).resolves({});

        req = { user, params: { commentId } };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        sut.handleDeleteComment(req, res).catch(reject);
      }));

      it('should call commentService.deleteComment', () => {
        sinon.assert.calledWith(commentService.deleteComment, { commentId, user });
      });
    });
  });
});
