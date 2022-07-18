import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import LessonService from './lesson-service.js';
import DocumentService from './document-service.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../test-helper.js';
import CdnResourcesConsolidationTaskProcessor from './cdn-resources-consolidation-task-processor.js';

describe('CdnResourcesConsolidationTaskProcessor', () => {
  let container;
  let documentService;
  let lessonService;
  const sandbox = sinon.createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
    lessonService = container.get(LessonService);
    sut = container.get(CdnResourcesConsolidationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(documentService, 'consolidateCdnResources');
    sandbox.stub(lessonService, 'consolidateCdnResources');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {

    it('should call consolidateCdnResources on documentService', async () => {
      const documentId = uniqueId.create();
      await sut.process({ taskParams: { documentId } }, {});
      sinon.assert.calledWith(documentService.consolidateCdnResources, documentId);
    });

    describe('when cancellation is requested', () => {
      const documentId = uniqueId.create();

      it('should throw an error', async () => {
        await expect(() => sut.process({ taskParams: { documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
      });

      it('should not call consolidateCdnResources', async () => {
        try {
          await sut.process({ taskParams: { documentId } }, { cancellationRequested: true });
          sinon.assert.fail('This code should not have been reached');
        } catch {
          sinon.assert.notCalled(documentService.consolidateCdnResources);
        }
      });
    });

  });
});
