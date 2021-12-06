/* eslint-disable max-lines */
import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('document-import-task-processor', () => {
  const sandbox = sinon.createSandbox();

  let sut;
  let cdn;
  let users;
  let container;
  let userService;
  let serverConfig;
  let importSource;
  let documentService;
  let exportApiClient;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    serverConfig = container.get(ServerConfig);
    exportApiClient = container.get(ExportApiClient);
    userService = container.get(UserService);
    cdn = container.get(Cdn);
    documentService = container.get(DocumentService);

    sut = container.get(DocumentImportTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(() => {
    importSource = { hostName: 'host.name', allowUnsecure: false, apiKey: 'FG5GFDFR352DFS' };
    sandbox.stub(serverConfig, 'importSources').value([importSource]);
    sandbox.stub(exportApiClient, 'getDocumentExport');
    sandbox.stub(userService, 'getUserById');
    sandbox.stub(userService, 'ensureExternalUser');
    sandbox.stub(cdn, 'uploadObjectFromUrl');
    sandbox.stub(documentService, 'getCurrentDocumentRevisionByKey');
    sandbox.stub(documentService, 'copyDocumentRevisions');
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('process', () => {
    let ctx;
    let task;
    let batchParams;
    let revision1;
    let revision2;
    let revision3;
    let revisionsToImport;

    describe('a task to import a new document', () => {
      beforeEach(async () => {
        users = [
          { _id: 'user-id-1', username: 'username1' },
          { _id: 'user-id-2', username: 'username2' }
        ];
        task = {
          taskParams: {
            key: 'key',
            importedRevision: null,
            importableRevision: 'rev-2'
          }
        };
        batchParams = { hostName: 'host.name' };
        revision1 = {
          _id: 'rev-1',
          key: 'key',
          createdBy: users[0]._id,
          order: 1,
          sections: [],
          cdnResources: ['resource-1']
        };
        revision2 = {
          _id: 'rev-2',
          key: 'key',
          createdBy: users[1]._id,
          order: 2,
          sections: [],
          cdnResources: ['resource-2']
        };
        revisionsToImport = [revision2, revision1];
        ctx = { cancellationRequested: false };

        exportApiClient.getDocumentExport.resolves({ revisions: revisionsToImport, users, cdnRootUrl: 'https://cdn.root.url' });

        userService.getUserById.withArgs(users[0]._id).resolves(users[0]);
        userService.getUserById.withArgs(users[1]._id).resolves(users[1]);

        cdn.uploadObjectFromUrl.resolves();

        documentService.copyDocumentRevisions.onCall(0).resolves(revision1);
        documentService.copyDocumentRevisions.onCall(1).resolves(revision2);

        await sut.process(task, batchParams, ctx);
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: 'https://host.name',
          apiKey: importSource.apiKey,
          documentKey: task.taskParams.key,
          afterRevision: task.taskParams.importedRevision,
          toRevision: task.taskParams.importableRevision
        });
      });

      it('should call userService.ensureExternalUser for the first user', () => {
        sinon.assert.calledWith(userService.ensureExternalUser, {
          _id: users[0]._id,
          username: users[0].username,
          hostName: batchParams.hostName
        });
      });

      it('should call userService.ensureExternalUser for the second user', () => {
        sinon.assert.calledWith(userService.ensureExternalUser, {
          _id: users[1]._id,
          username: users[1].username,
          hostName: batchParams.hostName
        });
      });

      it('should call cdn.uploadObjectFromUrl for all cdn resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl.firstCall, 'resource-1', 'https://cdn.root.url/resource-1');
        sinon.assert.calledWith(cdn.uploadObjectFromUrl.secondCall, 'resource-2', 'https://cdn.root.url/resource-2');
      });

      it('should call documentService.copyDocumentRevisions', () => {
        sinon.assert.calledWith(documentService.copyDocumentRevisions, {
          revisions: [revision1, revision2],
          ancestorId: null,
          origin: 'external/host.name',
          originUrl: 'https://host.name/docs/key'
        });
      });
    });

    describe('a task to update an already imported document', () => {
      beforeEach(async () => {
        users = [
          { _id: 'user-id-1', username: 'username1' },
          { _id: 'user-id-2', username: 'username2' }
        ];
        task = {
          taskParams: {
            key: 'key',
            importedRevision: 'rev-1',
            importableRevision: 'rev-3'
          }
        };
        batchParams = { hostName: 'host.name' };
        revision1 = {
          _id: 'rev-1',
          key: 'key'
        };
        revision2 = {
          _id: 'rev-2',
          key: 'key',
          createdBy: users[0]._id,
          order: 2,
          sections: [],
          cdnResources: ['resource-2']
        };
        revision3 = {
          _id: 'rev-3',
          key: 'key',
          createdBy: users[1]._id,
          order: 3,
          sections: [],
          cdnResources: ['resource-3']
        };
        revisionsToImport = [revision3, revision2];
        ctx = { cancellationRequested: false };

        exportApiClient.getDocumentExport.resolves({ revisions: revisionsToImport, users, cdnRootUrl: 'https://cdn.root.url' });

        userService.getUserById.withArgs(users[0]._id).resolves(users[0]);
        userService.getUserById.withArgs(users[1]._id).resolves(users[1]);

        cdn.uploadObjectFromUrl.resolves();

        documentService.getCurrentDocumentRevisionByKey.onCall(0).resolves(revision1);

        documentService.copyDocumentRevisions.onCall(0).resolves(revision2);
        documentService.copyDocumentRevisions.onCall(1).resolves(revision3);

        await sut.process(task, batchParams, ctx);
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: 'https://host.name',
          apiKey: importSource.apiKey,
          documentKey: task.taskParams.key,
          afterRevision: task.taskParams.importedRevision,
          toRevision: task.taskParams.importableRevision
        });
      });

      it('should call userService.ensureExternalUser for the first user', () => {
        sinon.assert.calledWith(userService.ensureExternalUser, {
          _id: users[0]._id,
          username: users[0].username,
          hostName: batchParams.hostName
        });
      });

      it('should call userService.ensureExternalUser for the second user', () => {
        sinon.assert.calledWith(userService.ensureExternalUser, {
          _id: users[1]._id,
          username: users[1].username,
          hostName: batchParams.hostName
        });
      });

      it('should call cdn.uploadObjectFromUrl for all cdn resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl.firstCall, 'resource-2', 'https://cdn.root.url/resource-2');
        sinon.assert.calledWith(cdn.uploadObjectFromUrl.secondCall, 'resource-3', 'https://cdn.root.url/resource-3');
      });

      it('should call documentService.copyDocumentRevisions', () => {
        sinon.assert.calledWith(documentService.copyDocumentRevisions, {
          revisions: [revision2, revision3],
          ancestorId: 'rev-1',
          origin: 'external/host.name',
          originUrl: 'https://host.name/docs/key'
        });
      });

    });

  });

});
