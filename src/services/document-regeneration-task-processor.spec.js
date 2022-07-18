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
      const documentId = uniqueId.create();

      await sut.process({ taskParams: { documentId } }, {});

      sinon.assert.calledWith(documentService.regenerateDocument, documentId);
    });

    it('should throw an error if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      await expect(() => sut.process({ taskParams: { documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
    });

    it('should not call regenerate document if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      try {
        await sut.process({ taskParams: { documentId } }, { cancellationRequested: true });
        sinon.assert.fail('This code should not have been reached');
      } catch {
        sinon.assert.notCalled(documentService.regenerateDocument);
      }
    });
  });
});
