import sinon from 'sinon';
import uniqueId from '../utils/unique-id.js';
import LessonService from './lesson-service.js';
import DocumentService from './document-service.js';
import { CDN_RESOURCES_CONSOLIDATION_TASK_TYPE } from '../domain/constants.js';
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

    describe('when type is document', () => {
      const type = CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.document;
      const documentKey = uniqueId.create();

      it('should call consolidateCdnResources on documentService', async () => {
        await sut.process({ taskParams: { type, documentKey } }, {});
        sinon.assert.calledWith(documentService.consolidateCdnResources, documentKey);
      });
    });

    describe('when type is lesson', () => {
      const type = CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.lesson;
      const lessonId = uniqueId.create();

      it('should call consolidateCdnResources on lessonService', async () => {
        await sut.process({ taskParams: { type, lessonId } }, {});
        sinon.assert.calledWith(lessonService.consolidateCdnResources, lessonId);
      });
    });

    describe('when cancellation is requested', () => {
      const type = CDN_RESOURCES_CONSOLIDATION_TASK_TYPE.document;
      const documentKey = uniqueId.create();

      it('should throw an error', async () => {
        await expect(() => sut.process({ taskParams: { type, documentKey } }, { cancellationRequested: true })).rejects.toThrow(Error);
      });

      it('should not call consolidateCdnResources', async () => {
        try {
          await sut.process({ taskParams: { type, documentKey } }, { cancellationRequested: true });
          sinon.assert.fail('This code should not have been reached');
        } catch {
          sinon.assert.notCalled(documentService.consolidateCdnResources);
        }
      });
    });

  });
});
