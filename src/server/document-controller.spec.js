import sinon from 'sinon';
import httpErrors from 'http-errors';
import { EventEmitter } from 'events';
import httpMocks from 'node-mocks-http';
import uniqueId from '../utils/unique-id.js';
import DocumentController from './document-controller.js';

const { NotFound } = httpErrors;

describe('document-controller', () => {
  const sandbox = sinon.createSandbox();

  let documentService;
  let clientDataMapper;
  let pageRenderer;

  let user;
  let doc;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getDocumentByKey: sandbox.stub(),
      getDocumentRevisionById: sandbox.stub(),
      createDocumentRegenerationBatch: sandbox.stub()
    };

    clientDataMapper = {
      mapDocOrRevision: sandbox.stub(),
      mapDocsOrRevisions: sandbox.stub(),
      createProposedSections: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    doc = { key: uniqueId.create(), slug: '', sections: [] };

    sut = new DocumentController(documentService, clientDataMapper, pageRenderer);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleGetDocPage', () => {
    let templateDocument;

    describe('when the document does not exist', () => {
      beforeEach(() => {
        req = {
          user,
          params: { 0: '', docKey: doc.key },
          query: {}
        };

        documentService.getDocumentByKey.withArgs(doc.docKey).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the document slug is different than the URL slug', () => {
      beforeEach(done => {
        req = {
          user,
          params: { 0: '/other-slug', docKey: doc.key },
          query: { view: 'edit', templateDocumentKey: uniqueId.create() }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        doc.slug = 'doc-slug';

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);

        sut.handleGetDocPage(req, res);
      });

      it('should redirect to the correct document url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl())
          .toBe(`/docs/${doc.key}/${doc.slug}?view=${req.query.view}&templateDocumentKey=${req.query.templateDocumentKey}`);
      });
    });

    describe('when the template document does not exist', () => {
      beforeEach(() => {
        req = {
          user,
          params: { 0: '', docKey: doc.key },
          query: { templateDocumentKey: uniqueId.create() }
        };

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);
        documentService.getDocumentByKey.withArgs(req.query.templateDocumentKey).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the template document exists but the document already contains sections', () => {
      beforeEach(done => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc.key },
          query: { templateDocumentKey: templateDocument.key }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', done);

        doc.slug = 'doc-slug';
        doc.sections = [{}];

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

        sut.handleGetDocPage(req, res);
      });

      it('should redirect to the original document url', () => {
        expect(res.statusCode).toBe(302);
        expect(res._getRedirectUrl()).toBe(`/docs/${doc.key}/${doc.slug}`);
      });
    });

    describe('when the view query param is not \'edit\'', () => {
      let mappedDocument;
      let templateSections;
      let mappedTemplateDocument;

      beforeEach(() => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc.key },
          query: { view: 'other', templateDocumentKey: templateDocument.key }
        };
        res = {};

        doc.slug = 'doc-slug';

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

        clientDataMapper.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);
        clientDataMapper.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        sut.handleGetDocPage(req, res);
      });

      it('should not call documentService.getDocumentRevisionById', () => {
        sinon.assert.notCalled(documentService.getDocumentRevisionById);
      });

      it('should call clientDataMapper.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMapper.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMapper.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMapper.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', {
          doc: mappedDocument, latestRevision: null, templateSections
        });
      });
    });

    describe('when the view query param is \'edit\'', () => {
      let mappedDocument;
      let documentRevision;
      let templateSections;
      let mappedDocumentRevision;
      let mappedTemplateDocument;

      beforeEach(() => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc.key },
          query: { view: 'edit', templateDocumentKey: templateDocument.key }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedDocumentRevision = { ...documentRevision };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

        documentService.getDocumentRevisionById.resolves(documentRevision);

        clientDataMapper.mapDocOrRevision.resolves(mappedDocumentRevision);
        clientDataMapper.mapDocsOrRevisions.resolves([mappedDocument, mappedTemplateDocument]);

        clientDataMapper.createProposedSections.returns(templateSections);
        pageRenderer.sendPage.resolves();

        sut.handleGetDocPage(req, res);
      });

      it('should call documentService.getDocumentRevisionById', () => {
        sinon.assert.calledWith(documentService.getDocumentRevisionById, doc.revision);
      });

      it('should call clientDataMapper.mapDocOrRevision', () => {
        sinon.assert.calledWith(clientDataMapper.mapDocOrRevision, documentRevision, user);
      });

      it('should call clientDataMapper.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMapper.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMapper.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMapper.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', {
          doc: mappedDocument, latestRevision: mappedDocumentRevision, templateSections
        });
      });
    });

    describe('when the view query param is \'edit\' but no templateDocumentKey is provided', () => {
      let mappedDocument;
      let documentRevision;
      let mappedDocumentRevision;

      beforeEach(() => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc.key },
          query: { view: 'edit' }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        mappedDocument = { ...doc };
        mappedDocumentRevision = { ...documentRevision };

        documentService.getDocumentByKey.withArgs(doc.key).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

        documentService.getDocumentRevisionById.resolves(documentRevision);

        clientDataMapper.mapDocOrRevision.resolves(mappedDocumentRevision);
        clientDataMapper.mapDocsOrRevisions.resolves([mappedDocument, null]);

        pageRenderer.sendPage.resolves();

        sut.handleGetDocPage(req, res);
      });

      it('should call documentService.getDocumentRevisionById', () => {
        sinon.assert.calledWith(documentService.getDocumentRevisionById, doc.revision);
      });

      it('should call clientDataMapper.mapDocOrRevision', () => {
        sinon.assert.calledWith(clientDataMapper.mapDocOrRevision, documentRevision, user);
      });

      it('should call clientDataMapper.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMapper.mapDocsOrRevisions, [doc, null], user);
      });

      it('should not call clientDataMapper.createProposedSections', () => {
        sinon.assert.notCalled(clientDataMapper.createProposedSections);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', {
          doc: mappedDocument, latestRevision: mappedDocumentRevision, templateSections: []
        });
      });
    });
  });

  describe('handlePostDocumentRegenerationBatch', () => {
    const batch = { _id: uniqueId.create() };
    beforeEach(done => {
      documentService.createDocumentRegenerationBatch.resolves(batch);

      req = httpMocks.createRequest({
        protocol: 'https',
        headers: { host: 'educandu.dev' }
      });
      req.user = user;

      res = httpMocks.createResponse({ eventEmitter: EventEmitter });
      res.on('end', done);

      sut.handlePostDocumentRegenerationBatch(req, res);
    });

    it('should call createDocumentRegenerationBatch with the user', () => {
      sinon.assert.calledWith(documentService.createDocumentRegenerationBatch, user);
    });

    it('should return the batch', () => {
      expect(res._getData()).toEqual(batch);
    });
  });

});
