import sinon from 'sinon';
import ImportService from './import-service.js';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import ExportApiClient from '../api-clients/export-api-client.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('import-service', () => {
  const sandbox = sinon.createSandbox();

  let sut;
  let user;
  let container;
  let importSource;
  let documentStore;
  let exportApiClient;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    exportApiClient = container.get(ExportApiClient);
    documentStore = container.get(DocumentStore);
    sut = container.get(ImportService);

    user = await setupTestUser(container);
  });

  beforeEach(() => {
    importSource = {
      name: 'source-1',
      hostName: 'source1.com',
      allowUnsecure: false,
      apiKey: 'DFGRDB553dscfVDSv'
    };
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('_getAllImportedDocumentsMetadata', () => {
    let result;

    describe('with \'website.com\' import domain', () => {
      const testDocs = [
        { title: 'doc-1', archived: false, origin: DOCUMENT_ORIGIN.internal },
        { title: 'doc-2', archived: true, origin: DOCUMENT_ORIGIN.internal },
        { title: 'doc-3', archived: false, origin: `${DOCUMENT_ORIGIN.external}/website.com` },
        { title: 'doc-4', archived: true, origin: `${DOCUMENT_ORIGIN.external}/website.com` },
        { title: 'doc-5', archived: false, origin: `${DOCUMENT_ORIGIN.external}/website.de` }
      ];

      beforeEach(async () => {
        for (const testDoc of testDocs) {
          // eslint-disable-next-line no-await-in-loop
          await createTestDocument(container, user, testDoc);
        }
        result = await sut._getAllImportedDocumentsMetadata('website.com');
      });

      it('should not return unarchived documents with origin \'internal\'', () => {
        expect(result.find(doc => doc.title === 'doc-1')).toBeUndefined();
      });

      it('should not return archived documents with origin \'internal\'', () => {
        expect(result.find(doc => doc.title === 'doc-2')).toBeUndefined();
      });

      it('should return unarchived documents with origin \'external/website.com\'', () => {
        expect(result.find(doc => doc.title === 'doc-3')).toBeDefined();
      });

      it('should not return archived documents with origin \'external/website.com\'', () => {
        expect(result.find(doc => doc.title === 'doc-4')).toBeUndefined();
      });

      it('should not return unarchived documents with origin \'external/website.de\'', () => {
        expect(result.find(doc => doc.title === 'doc-5')).toBeUndefined();
      });
    });

  });

  describe('getAllImportableDocumentsMetadata', () => {
    let result;

    beforeEach(() => {
      sandbox.stub(documentStore, 'getPublicNonArchivedDocumentsMetadataByOrigin');
      sandbox.stub(exportApiClient, 'getExports');

      importSource = {
        name: 'Other System',
        hostName: 'other-system.com',
        allowUnsecure: true,
        apiKey: 'FSDdsh35nADh44nADCD8'
      };
    });

    describe('on every call', () => {
      beforeEach(async () => {
        exportApiClient.getExports.resolves({ docs: [] });
        documentStore.getPublicNonArchivedDocumentsMetadataByOrigin.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should call exportApiClient.getExports', () => {
        sinon.assert.calledWith(exportApiClient.getExports, { baseUrl: 'http://other-system.com', apiKey: 'FSDdsh35nADh44nADCD8' });
      });

      it('should call documentStore.getPublicNonArchivedDocumentsMetadataByOrigin', () => {
        sinon.assert.calledWith(documentStore.getPublicNonArchivedDocumentsMetadataByOrigin, 'external/other-system.com');
      });
    });

    describe('when there are no exportable and no already imported documents', () => {
      beforeEach(async () => {
        documentStore.getPublicNonArchivedDocumentsMetadataByOrigin.resolves([]);
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only already imported documents', () => {
      beforeEach(async () => {
        documentStore.getPublicNonArchivedDocumentsMetadataByOrigin.resolves([{ _id: 'documentId', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]);
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only exportable documents', () => {
      beforeEach(async () => {
        documentStore.getPublicNonArchivedDocumentsMetadataByOrigin.resolves([]);
        exportApiClient.getExports.resolves({
          docs: [{ _id: 'documentId', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]
        });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an array of documents that can be freshly imported (added)', () => {
        expect(result).toEqual([{ _id: 'documentId', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language', importType: 'add' }]);
      });
    });

    describe('when there are both exportable and already imported documents', () => {
      beforeEach(async () => {
        documentStore.getPublicNonArchivedDocumentsMetadataByOrigin.resolves([
          { _id: 'documentId1', revision: 'revision1a', updatedOn: 'updatedOn1a', title: 'title1a', slug: 'slug1a', language: 'language1a' },
          { _id: 'documentId2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { _id: 'documentId3', revision: 'revision3a', updatedOn: 'updatedOn3a', title: 'title3a', slug: 'slug3a', language: 'language3a' }
        ]);
        exportApiClient.getExports.resolves({ docs: [
          { _id: 'documentId1', revision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b' },
          { _id: 'documentId2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { _id: 'documentId4', revision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a' }
        ] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return the array of importable documents', () => {
        expect(result).toEqual([
          { _id: 'documentId1', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b', importType: 'update' },
          { _id: 'documentId2', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a', importType: 'reimport' },
          { _id: 'documentId4', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a', importType: 'add' }
        ]);
      });
    });
  });
});
