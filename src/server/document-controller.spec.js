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
      getDocumentByKey: sandbox.stub()
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
          params: { 0: '', docKey: doc._id },
          query: {}
        };

        documentService.getDocumentByKey.withArgs(doc.docKey).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the document slug is different than the URL slug', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        req = {
          user,
          params: { 0: '/other-slug', docKey: doc._id },
          query: { view: 'edit', templateDocumentKey: uniqueId.create() }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.slug = 'doc-slug';

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);

        sut.handleGetDocPage(req, res).catch(reject);
      }));

      it('should redirect to the correct document url', () => {
        expect(res.statusCode).toBe(301);
        expect(res._getRedirectUrl())
          .toBe(`/docs/${doc._id}/${doc.slug}?view=${req.query.view}&templateDocumentKey=${req.query.templateDocumentKey}`);
      });
    });

    describe('when the template document does not exist', () => {
      beforeEach(() => {
        req = {
          user,
          params: { 0: '', docKey: doc._id },
          query: { templateDocumentKey: uniqueId.create() }
        };

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);
        documentService.getDocumentByKey.withArgs(req.query.templateDocumentKey).resolves(null);
      });

      it('should throw NotFound', async () => {
        await expect(() => sut.handleGetDocPage(req, {})).rejects.toThrow(NotFound);
      });
    });

    describe('when the template document exists but the document already contains sections', () => {
      beforeEach(() => new Promise((resolve, reject) => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc._id },
          query: { templateDocumentKey: templateDocument.key }
        };
        res = httpMocks.createResponse({ eventEmitter: EventEmitter });
        res.on('end', resolve);

        doc.slug = 'doc-slug';
        doc.sections = [{}];

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

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
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc._id },
          query: { view: 'other', templateDocumentKey: templateDocument.key }
        };
        res = {};

        doc.slug = 'doc-slug';

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

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
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc._id },
          query: { view: 'edit', templateDocumentKey: templateDocument.key }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        templateSections = [{}];
        mappedDocument = { ...doc };
        mappedTemplateDocument = { ...templateDocument };

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

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

    describe('when the view query param is \'edit\' but no templateDocumentKey is provided', () => {
      let mappedDocument;
      let documentRevision;

      beforeEach(() => {
        templateDocument = { key: uniqueId.create() };
        req = {
          user,
          params: { 0: '/doc-slug', docKey: doc._id },
          query: { view: 'edit' }
        };
        res = {};

        documentRevision = { _id: uniqueId.create() };

        doc.slug = 'doc-slug';
        doc.revision = documentRevision._id;

        mappedDocument = { ...doc };

        documentService.getDocumentByKey.withArgs(doc._id).resolves(doc);
        documentService.getDocumentByKey.withArgs(templateDocument.key).resolves(templateDocument);

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
