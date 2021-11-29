import sinon from 'sinon';
import httpErrors from 'http-errors';
import Database from '../stores/database.js';
import ImportService from './import-service.js';
import ExportApiClient from './export-api-client.js';
import DocumentStore from '../stores/document-store.js';
import BatchLockStore from '../stores/batch-lock-store.js';
import { BATCH_TYPE, DOCUMENT_ORIGIN, TASK_TYPE } from '../common/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

const { BadRequest } = httpErrors;

describe('import-service', () => {

  const sandbox = sinon.createSandbox();

  let container;
  let user;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
    sut = container.get(ImportService);
    db = container.get(Database);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getAllImportedDocumentsMetadata', () => {
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
    let result;

    const importSource = {
      name: 'Other System',
      hostName: 'other-system.com',
      allowUnsecure: true,
      apiKey: 'FSDdsh35nADh44nADCD8'
    };

    beforeEach(() => {
      exportApiClient = container.get(ExportApiClient);
      sandbox.stub(exportApiClient, 'getExports');
      documentStore = container.get(DocumentStore);
      sandbox.stub(documentStore, 'find');
    });

    describe('on every call', () => {
      beforeEach(async () => {
        exportApiClient.getExports.resolves({ docs: [] });
        documentStore.find.resolves([]);
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should call exportApiClient.getExports', () => {
        sinon.assert.calledWith(exportApiClient.getExports, { baseUrl: 'http://other-system.com', apiKey: 'FSDdsh35nADh44nADCD8' });
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
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only already imported documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]);
        exportApiClient.getExports.resolves({ docs: [] });
        result = await sut.getAllImportableDocumentsMetadata(importSource);
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are only exportable documents', () => {
      beforeEach(async () => {
        documentStore.find.resolves([]);
        exportApiClient.getExports.resolves({
          docs: [{ key: 'key', revision: 'revision', updatedOn: 'updatedOn', title: 'title', slug: 'slug', language: 'language' }]
        });
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
        exportApiClient.getExports.resolves({ docs: [
          { key: 'key1', revision: 'revision1b', updatedOn: 'updatedOn1b', title: 'title1b', slug: 'slug1b', language: 'language1b' },
          { key: 'key2', revision: 'revision2a', updatedOn: 'updatedOn2a', title: 'title2a', slug: 'slug2a', language: 'language2a' },
          { key: 'key4', revision: 'revision4a', updatedOn: 'updatedOn4a', title: 'title4a', slug: 'slug4a', language: 'language4a' }
        ] });
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

  describe('createImportBatch', () => {
    let importSource;
    let documentsToImport;
    let result;

    beforeEach(() => {
      importSource = {
        name: 'source-1',
        hostName: 'source1.com',
        allowUnsecure: false,
        apiKey: 'DFGRDB553dscfVDSv'
      };
      documentsToImport = [
        {
          key: 'v5NSMktadhzquVUAEdzAKg',
          title: 'doc-1',
          slug: 'doc-1',
          language: 'en',
          updatedOn: '2021-11-24T16:00:32.200Z',
          importedRevision: null,
          importableRevision: 'gvxaYSFamGGfeWTYPrA6q9',
          importType: 'add'
        },
        {
          key: 'sueoX7WCUtSUHT9cWE6UMq',
          title: 'doc-2',
          slug: 'doc-2',
          language: 'en',
          updatedOn: '2021-11-24T16:05:27.800Z',
          importedRevision: 'wtwS9CJndhKkdFrCHFEifM',
          importableRevision: '6AXHKzH3z26r7JKJyPN6er',
          importType: 'update'
        }
      ];
    });

    describe('when creating a new batch', () => {

      beforeEach(async () => {
        result = await sut.createImportBatch({ importSource, documentsToImport, user });
      });

      it('creates a new batch in the database', async () => {
        const dbEntries = await db.batches.find({}).toArray();
        expect(dbEntries).toEqual([
          {
            _id: expect.stringMatching(/\w+/),
            createdBy: user._id,
            createdOn: expect.any(Date),
            completedOn: null,
            batchType: BATCH_TYPE.importDocuments,
            batchParams: {
              name: 'source-1',
              hostName: 'source1.com',
              allowUnsecure: false
            },
            errors: []
          }
        ]);
      });

      it('creates all tasks of the new batch in the database', async () => {
        const dbEntries = await db.tasks.find({}).toArray();
        expect(dbEntries).toEqual([
          {
            _id: expect.stringMatching(/\w+/),
            batchId: expect.stringMatching(/\w+/),
            taskType: TASK_TYPE.importDocument,
            processed: false,
            attempts: [],
            taskParams: {
              ...documentsToImport[0],
              updatedOn: new Date(documentsToImport[0].updatedOn)
            }
          },
          {
            _id: expect.stringMatching(/\w+/),
            batchId: expect.stringMatching(/\w+/),
            taskType: TASK_TYPE.importDocument,
            processed: false,
            attempts: [],
            taskParams: {
              ...documentsToImport[1],
              updatedOn: new Date(documentsToImport[1].updatedOn)
            }
          }
        ]);
      });

      it('returns the created batch object', async () => {
        const dbEntries = await db.batches.find({}).toArray();
        expect(dbEntries).toEqual([result]);
      });

    });

    describe('when there is an existing lock for the same import source', () => {
      let lock;
      let batchLockStore;

      beforeEach(async () => {
        batchLockStore = container.get(BatchLockStore);
        lock = await batchLockStore.takeLock(importSource.hostName);
      });

      afterEach(async () => {
        await batchLockStore.releaseLock(lock);
      });

      it('should fail the concurrency check', () => {
        expect(() => sut.createImportBatch({ importSource, documentsToImport, user }))
          .rejects
          .toThrowError(BadRequest);
      });
    });

    describe('when there is an existing batch that is not yet completely processed', () => {
      beforeEach(async () => {
        await sut.createImportBatch({ importSource, documentsToImport, user });
      });

      it('should fail the unique check', () => {
        expect(() => sut.createImportBatch({ importSource, documentsToImport, user }))
          .rejects
          .toThrowError(BadRequest);
      });
    });

  });

});
