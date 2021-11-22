import sinon from 'sinon';
import ImportService from './import-service.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('import-service', () => {

  const sandbox = sinon.createSandbox();

  let container;
  let result;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
    sut = container.get(ImportService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getAllImportedDocumentsMetadata', () => {

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
        result = await sut.getAllImportedDocumentsMetadata('website.com');
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
    let documentStore;
    let exportApiClient;

    const importSource = {
      name: 'Other System',
      baseUrl: 'https://other-system.com',
      apiKey: 'FSDdsh35nADh44nADCD8'
    };

    beforeEach(() => {
      exportApiClient = {
        getExports: sandbox.stub()
      };
      documentStore = {
        find: sandbox.stub()
      };
      sut = new ImportService(documentStore, exportApiClient);
    });

    describe('on every call', () => {
      beforeEach(async () => {
        exportApiClient.getExports.resolves([]);
        documentStore.find.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should call exportApiClient.getExports', () => {
        sinon.assert.calledWith(exportApiClient.getExports, { baseUrl: 'https://other-system.com', apiKey: 'FSDdsh35nADh44nADCD8' });
      });

      it('should call documentStore.find', () => {
        sinon.assert.calledWith(documentStore.find, {
          archived: false,
          origin: 'external/other-system.com'
        }, {
          sort: [['updatedOn', -1]],
          projection: { key: 1, revision: 1, updatedOn: 1, title: 1, slug: 1, language: 1 }
        });
      });
    });

    describe('when there are no exportable and no already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([]);
        exportApiClient.getExports.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]);
        exportApiClient.getExports.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only exportable documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([]);
        exportApiClient.getExports.resolves([{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an array of documents that can be freshly imported (added)', () => {
        expect(result).toEqual([{ key: 'key', importedRevision: null, importableRevision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language', importType: 'add' }]);
      });
    });

    describe('when there are both exportable and already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([
          { key: 'key1', revision: 'revision1a', updatedOn: 'updatedOn1a', title: 'title1a', slug: 'slug1a', language: 'language1a' },
          { key: 'key2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { key: 'key3', revision: 'revision3a', updatedOn: 'updatedOn3a', title: 'title3a', slug: 'slug3a', language: 'language3a' }
        ]);
        exportApiClient.getExports.resolves([
          { key: 'key1', revision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b' },
          { key: 'key2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { key: 'key4', revision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a' }
        ]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an array of documents that can be updated or freshly imported (added)', () => {
        expect(result).toEqual([
          { key: 'key1', importedRevision: 'revision1a', importableRevision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b', importType: 'update' },
          { key: 'key4', importedRevision: null, importableRevision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a', importType: 'add' }
        ]);
      });
    });
  });

});
