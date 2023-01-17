import { assert, createSandbox } from 'sinon';
import uniqueId from '../../utils/unique-id.js';
import DocumentService from '../document-service.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../../test-helper.js';
import DocumentRegenerationTaskProcessor from './document-regeneration-task-processor.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('DocumentRegenerationTaskProcessor', () => {
  let container;
  let documentService;
  const sandbox = createSandbox();

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

      assert.calledWith(documentService.regenerateDocument, documentId);
    });

    it('should throw an error if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      await expect(() => sut.process({ taskParams: { documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
    });

    it('should not call regenerate document if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      try {
        await sut.process({ taskParams: { documentId } }, { cancellationRequested: true });
        assert.fail('This code should not have been reached');
      } catch {
        assert.notCalled(documentService.regenerateDocument);
      }
    });
  });
});
