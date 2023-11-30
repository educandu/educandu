import { assert, createSandbox } from 'sinon';
import RoomService from '../../room-service.js';
import UserService from '../../user-service.js';
import uniqueId from '../../../utils/unique-id.js';
import SettingService from '../../setting-service.js';
import DocumentService from '../../document-service.js';
import { CDN_RESOURCES_CONSOLIDATION_TYPE } from '../../../domain/constants.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../../../test-helper.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import CdnResourcesConsolidationTaskProcessor from './cdn-resources-consolidation-task-processor.js';

describe('CdnResourcesConsolidationTaskProcessor', () => {
  let container;
  let roomService;
  let userService;
  let settingService;
  let documentService;
  const sandbox = createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    roomService = container.get(RoomService);
    userService = container.get(UserService);
    settingService = container.get(SettingService);
    documentService = container.get(DocumentService);
    sut = container.get(CdnResourcesConsolidationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(roomService, 'consolidateCdnResources');
    sandbox.stub(userService, 'consolidateCdnResources');
    sandbox.stub(settingService, 'consolidateCdnResources');
    sandbox.stub(documentService, 'consolidateCdnResources');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {

    describe('when the entity type is document', () => {
      it('should call consolidateCdnResources on documentService', async () => {
        const entityId = uniqueId.create();
        await sut.process({ taskParams: { type: CDN_RESOURCES_CONSOLIDATION_TYPE.document, entityId } }, {});
        assert.calledWith(documentService.consolidateCdnResources, entityId);
      });
    });

    describe('when the entity type is room', () => {
      it('should call consolidateCdnResources on roomService', async () => {
        const entityId = uniqueId.create();
        await sut.process({ taskParams: { type: CDN_RESOURCES_CONSOLIDATION_TYPE.room, entityId } }, {});
        assert.calledWith(roomService.consolidateCdnResources, entityId);
      });
    });

    describe('when the entity type is user', () => {
      it('should call consolidateCdnResources on userService', async () => {
        const entityId = uniqueId.create();
        await sut.process({ taskParams: { type: CDN_RESOURCES_CONSOLIDATION_TYPE.user, entityId } }, {});
        assert.calledWith(userService.consolidateCdnResources, entityId);
      });
    });

    describe('when the entity type is setting', () => {
      it('should call consolidateCdnResources on settingService', async () => {
        const entityId = uniqueId.create();
        await sut.process({ taskParams: { type: CDN_RESOURCES_CONSOLIDATION_TYPE.setting, entityId } }, {});
        assert.calledWith(settingService.consolidateCdnResources, entityId);
      });
    });

    describe('when cancellation is requested', () => {
      const entityId = uniqueId.create();

      it('should throw an error', async () => {
        await expect(() => sut.process({ taskParams: { entityId } }, { cancellationRequested: true })).rejects.toThrow(Error);
      });

      it('should not call consolidateCdnResources', async () => {
        try {
          await sut.process({ taskParams: { entityId } }, { cancellationRequested: true });
          assert.fail('This code should not have been reached');
        } catch {
          assert.notCalled(documentService.consolidateCdnResources);
        }
      });
    });

  });
});
