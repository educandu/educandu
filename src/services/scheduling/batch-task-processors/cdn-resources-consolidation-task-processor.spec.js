import { assert, createSandbox } from 'sinon';
import uniqueId from '../../../utils/unique-id.js';
import DocumentService from '../../document-service.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../../../test-helper.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import CdnResourcesConsolidationTaskProcessor from './cdn-resources-consolidation-task-processor.js';

describe('CdnResourcesConsolidationTaskProcessor', () => {
  let container;
  let documentService;
  const sandbox = createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
    sut = container.get(CdnResourcesConsolidationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(documentService, 'consolidateCdnResources');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {

    it('should call consolidateCdnResources on documentService', async () => {
      const documentId = uniqueId.create();
      await sut.process({ taskParams: { documentId } }, {});
      assert.calledWith(documentService.consolidateCdnResources, documentId);
    });

    describe('when cancellation is requested', () => {
      const documentId = uniqueId.create();

      it('should throw an error', async () => {
        await expect(() => sut.process({ taskParams: { documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
      });

      it('should not call consolidateCdnResources', async () => {
        try {
          await sut.process({ taskParams: { documentId } }, { cancellationRequested: true });
          assert.fail('This code should not have been reached');
        } catch {
          assert.notCalled(documentService.consolidateCdnResources);
        }
      });
    });

  });
});
