import { assert, createSandbox } from 'sinon';
import uniqueId from '../../../utils/unique-id.js';
import DocumentService from '../../document-service.js';
import DocumentValidationTaskProcessor from './document-validation-task-processor.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../../../test-helper.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('DocumentValidationTaskProcessor', () => {
  let container;
  let documentService;
  const sandbox = createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
    sut = container.get(DocumentValidationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(documentService, 'validateDocument');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {
    it('should call validate document', async () => {
      const documentId = uniqueId.create();

      await sut.process({ taskParams: { documentId } }, {});

      assert.calledWith(documentService.validateDocument, documentId);
    });

    it('should throw an error if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      await expect(() => sut.process({ taskParams: { documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
    });

    it('should not call validate document if a cancellation was requested', async () => {
      const documentId = uniqueId.create();

      try {
        await sut.process({ taskParams: { documentId } }, { cancellationRequested: true });
        assert.fail('This code should not have been reached');
      } catch {
        assert.notCalled(documentService.validateDocument);
      }
    });
  });
});
