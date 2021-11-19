import ExportService from './export-service.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';
import { createTestDocument, destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('export-service', () => {
  let container;
  let user;
  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    user = await setupTestUser(container);
    sut = container.get(ExportService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
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

});
