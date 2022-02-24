import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import DocumentService from './document-service.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../test-helper.js';
import DocumentRegenerationTaskProcessor from './document-regeneration-task-processor.js';

describe('DocumentRegenerationTaskProcessor', () => {
  let container;
  let documentService;
  const sandbox = sinon.createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
    sut = container.get(DocumentRegenerationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(documentService, 'regenerateDocument');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {
    it('should call regenerate document', async () => {
      const documentKey = uniqueId.create();

      await sut.process({ taskParams: { key: documentKey } }, {});

      sinon.assert.calledWith(documentService.regenerateDocument, documentKey);
    });

    it('should throw an error if a cancellation was requested', async () => {
      const documentKey = uniqueId.create();

      await expect(() => sut.process({ taskParams: { key: documentKey } }, { cancellationRequested: true })).rejects.toThrow(Error);
    });

    it('should not call regenerate document if a cancellation was requested', () => {
      const documentKey = uniqueId.create();

      sut.process({ taskParams: { key: documentKey } }, { cancellationRequested: true })
        .catch(() => {
          sinon.assert.notCalled(documentService.regenerateDocument);
        });
    });
  });
});
