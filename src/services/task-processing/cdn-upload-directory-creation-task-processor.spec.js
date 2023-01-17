import RoomService from '../room-service.js';
import { assert, createSandbox } from 'sinon';
import uniqueId from '../../utils/unique-id.js';
import DocumentService from '../document-service.js';
import { CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE } from '../../domain/constants.js';
import { setupTestEnvironment, destroyTestEnvironment } from '../../test-helper.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import CdnUploadDirectoryCreationTaskProcessor from './cdn-upload-directory-creation-task-processor.js';

describe('CdnUploadDirectoryCreationTaskProcessor', () => {
  let container;
  let documentService;
  let roomService;
  const sandbox = createSandbox();

  let sut;

  beforeAll(async () => {
    container = await setupTestEnvironment();
    documentService = container.get(DocumentService);
    roomService = container.get(RoomService);
    sut = container.get(CdnUploadDirectoryCreationTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    sandbox.stub(documentService, 'createUploadDirectoryMarkerForDocument');
    sandbox.stub(roomService, 'createUploadDirectoryMarkerForRoom');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('process', () => {

    describe('when type is document', () => {
      const type = CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document;
      const documentId = uniqueId.create();

      it('should call createUploadDirectoryMarkerForDocument on documentService', async () => {
        await sut.process({ taskParams: { type, documentId } }, {});
        assert.calledWith(documentService.createUploadDirectoryMarkerForDocument, documentId);
      });
    });

    describe('when type is room', () => {
      const type = CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room;
      const roomId = uniqueId.create();

      it('should call createUploadDirectoryMarkerForRoom on roomService', async () => {
        await sut.process({ taskParams: { type, roomId } }, {});
        assert.calledWith(roomService.createUploadDirectoryMarkerForRoom, roomId);
      });
    });

    describe('when type is document and cancellation is requested', () => {
      const type = CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document;
      const documentId = uniqueId.create();

      it('should throw an error', async () => {
        await expect(() => sut.process({ taskParams: { type, documentId } }, { cancellationRequested: true })).rejects.toThrow(Error);
      });

      it('should not call createUploadDirectoryMarkerForDocument', async () => {
        try {
          await sut.process({ taskParams: { type, documentId } }, { cancellationRequested: true });
          assert.fail('This code should not have been reached');
        } catch {
          assert.notCalled(documentService.createUploadDirectoryMarkerForDocument);
        }
      });
    });

  });
});
