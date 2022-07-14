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
  let clientDataMappingService;
  let pageRenderer;

  let user;
  let doc;
  let req;
  let res;
  let sut;

  beforeEach(() => {
    documentService = {
      getDocumentById: sandbox.stub()
    };

    clientDataMappingService = {
      mapDocsOrRevisions: sandbox.stub(),
      createProposedSections: sandbox.stub()
    };

    pageRenderer = {
      sendPage: sandbox.stub()
    };

    user = { _id: uniqueId.create() };
    doc = { _id: uniqueId.create(), slug: '', sections: [] };

    sut = new DocumentController(documentService, clientDataMappingService, pageRenderer);
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
      let mappedDocument;
      let templateSections;
      let mappedTemplateDocument;

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

        sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMappingService.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMappingService.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, templateSections });
      });
    });

    describe('when the view query param is \'edit\'', () => {
      let mappedDocument;
      let documentRevision;
      let templateSections;
      let mappedTemplateDocument;

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

        sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, templateDocument], user);
      });

      it('should call clientDataMappingService.createProposedSections', () => {
        sinon.assert.calledWith(clientDataMappingService.createProposedSections, mappedTemplateDocument);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, templateSections });
      });
    });

    describe('when the view query param is \'edit\' but no templateDocumentId is provided', () => {
      let mappedDocument;
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

        sut.handleGetDocPage(req, res);
      });

      it('should call clientDataMappingService.mapDocsOrRevisions', () => {
        sinon.assert.calledWith(clientDataMappingService.mapDocsOrRevisions, [doc, null], user);
      });

      it('should not call clientDataMappingService.createProposedSections', () => {
        sinon.assert.notCalled(clientDataMappingService.createProposedSections);
      });

      it('should call pageRenderer.sendPage', () => {
        sinon.assert.calledWith(pageRenderer.sendPage, req, res, 'doc', { doc: mappedDocument, templateSections: [] });
      });
    });
  });

});
