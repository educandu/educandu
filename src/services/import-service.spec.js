import ImportService from './import-service.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('import-service', () => {
  let container;
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

});
