import sinon from 'sinon';
import UserService from './user-service.js';
import ExportService from './export-service.js';
import DocumentService from './document-service.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('export-service', () => {

  const sandbox = sinon.createSandbox();

  let documentService;
  let userService;
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);

    documentService = container.get(DocumentService);
    userService = container.get(UserService);
    sut = container.get(ExportService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
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
    const rev1 = { _id: '1', order: 1 };
    const rev2 = { _id: '2', order: 2 };
    const rev3 = { _id: '3', order: 3 };
    const rev4 = { _id: '4', order: 4 };

    beforeEach(() => {
      userService.extractUserIdSetFromDocsOrRevisions.returns(new Set(['user1']));
      userService.getUsersByIds.resolves([{ _id: 'user1', username: 'JohnDoe' }]);
      documentService.getAllDocumentRevisionsByKey.resolves([rev3, rev1, rev2, rev4]);
    });

    const negativeTestCases = [
      { afterRevision: null, toRevision: null },
      { afterRevision: null, toRevision: '0' },
      { afterRevision: null, toRevision: '5' },
      { afterRevision: 'x', toRevision: '4' },
      { afterRevision: '4', toRevision: '4' }
    ];

    const positiveTestCases = [
      { afterRevision: null, toRevision: '1', expectedRevisions: [rev1] },
      { afterRevision: null, toRevision: '4', expectedRevisions: [rev1, rev2, rev3, rev4] },
      { afterRevision: '1', toRevision: '3', expectedRevisions: [rev2, rev3] },
      { afterRevision: '2', toRevision: '3', expectedRevisions: [rev3] }
    ];

    let result;
    let expectedError;

    negativeTestCases.forEach(({ afterRevision, toRevision }) => {
      describe(`with afterRevision = '${afterRevision}' and toRevision = '${toRevision}'`, () => {
        beforeEach(async () => {
          result = null;
          expectedError = `The specified revision interval (${afterRevision} - ${toRevision}) is invalid for document abc`;

          try {
            await sut.getDocumentExport({ key: 'abc', afterRevision, toRevision });
          } catch (error) {
            result = error;
          }
        });

        it('should throw', () => {
          expect(result.message).toBe(expectedError);
        });
      });
    });

    positiveTestCases.forEach(({ afterRevision, toRevision, expectedRevisions }) => {
      describe(`with afterRevision = '${afterRevision}' and toRevision = '${toRevision}'`, () => {
        beforeEach(async () => {
          result = await sut.getDocumentExport({ key: 'abc', afterRevision, toRevision });
        });

        it('should call userService.extractUserIdSetFromDocsOrRevisions', () => {
          sinon.assert.calledWith(userService.extractUserIdSetFromDocsOrRevisions, expectedRevisions);
        });

        it('should return revisions', () => {
          expect(result).toEqual({ revisions: expectedRevisions, users: [{ _id: 'user1', username: 'JohnDoe' }] });
        });
      });
    });
  });

});
