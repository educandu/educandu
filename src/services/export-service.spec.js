import sinon from 'sinon';
import UserService from './user-service.js';
import ExportService from './export-service.js';
import DocumentService from './document-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('export-service', () => {

  const sandbox = sinon.createSandbox();

  let documentService;
  let serverConfig;
  let userService;
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);

    serverConfig = container.get(ServerConfig);
    documentService = container.get(DocumentService);
    userService = container.get(UserService);
    sut = container.get(ExportService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.root.url');
    sandbox.stub(userService, 'extractUserIdSetFromDocsOrRevisions');
    sandbox.stub(userService, 'getUsersByIds');
    sandbox.stub(documentService, 'getAllDocumentRevisionsByKey');
  });

  afterEach(async () => {
    sandbox.restore();
    await pruneTestEnvironment(container);
  });

  describe('getAllExportableDocumentsMetadata', () => {

    const testDocs = [
      { title: 'doc-1', archived: false, origin: DOCUMENT_ORIGIN.internal },
      { title: 'doc-2', archived: true, origin: DOCUMENT_ORIGIN.internal },
      { title: 'doc-3', archived: false, origin: `${DOCUMENT_ORIGIN.external}/some-site` },
      { title: 'doc-4', archived: true, origin: `${DOCUMENT_ORIGIN.external}/some-site-2` }
    ];

    let result;

    beforeEach(async () => {
      for (const testDoc of testDocs) {
        /* eslint-disable-next-line no-await-in-loop */
        await createTestDocument(container, user, testDoc);
      }
      result = await sut.getAllExportableDocumentsMetadata();
    });

    it('should return internal unarchived documents', () => {
      expect(result.find(doc => doc.title === 'doc-1')).toBeDefined();
    });

    it('should not return internal archived documents', () => {
      expect(result.find(doc => doc.title === 'doc-2')).toBeUndefined();
    });

    it('should not return external unarchived documents', () => {
      expect(result.find(doc => doc.title === 'doc-3')).toBeUndefined();
    });

    it('should not return external archived documents', () => {
      expect(result.find(doc => doc.title === 'doc-4')).toBeUndefined();
    });

  });

  describe('getDocumentExport', () => {
    let result;

    const rev1 = { _id: '1', order: 1 };
    const rev2 = { _id: '2', order: 2 };
    const rev3 = { _id: '3', order: 3 };

    beforeEach(() => {
      userService.extractUserIdSetFromDocsOrRevisions.returns(new Set(['user1']));
      userService.getUsersByIds.resolves([{ _id: 'user1', username: 'JohnDoe' }]);
      documentService.getAllDocumentRevisionsByKey.resolves([rev2, rev3, rev1]);
    });

    describe('with toRevision = null', () => {
      beforeEach(async () => {
        result = null;

        try {
          await sut.getDocumentExport({ key: 'abc', toRevision: null });
        } catch (error) {
          result = error;
        }
      });

      it('should throw', () => {
        expect(result.message).toBe('The specified revision \'null\' is invalid for document \'abc\'');
      });
    });

    describe('with toRevision = \'4\'', () => {
      beforeEach(async () => {
        result = null;

        try {
          await sut.getDocumentExport({ key: 'abc', toRevision: '4' });
        } catch (error) {
          result = error;
        }
      });

      it('should throw', () => {
        expect(result.message).toBe('The specified revision \'4\' is invalid for document \'abc\'');
      });
    });

    describe('with toRevision = \'2\'', () => {
      beforeEach(async () => {
        result = await sut.getDocumentExport({ key: 'abc', toRevision: '2' });
      });

      it('should call userService.extractUserIdSetFromDocsOrRevisions', () => {
        sinon.assert.calledWith(userService.extractUserIdSetFromDocsOrRevisions, [rev1, rev2]);
      });

      it('should return revisions', () => {
        expect(result).toEqual({ revisions: [rev1, rev2], users: [{ _id: 'user1', username: 'JohnDoe' }], cdnRootUrl: 'https://cdn.root.url' });
      });
    });
  });

});
