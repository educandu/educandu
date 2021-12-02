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
    sandbox.stub(userService, 'getUserById');
    sandbox.stub(userService, 'ensureExternalUser');
    sandbox.stub(exportApiClient, 'getDocumentExport');
    sandbox.stub(cdn, 'uploadObjectFromUrl');
    sandbox.stub(documentService, 'getCurrentDocumentRevisionByKey');
    sandbox.stub(documentService, 'copyDocumentRevision');
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('process', () => {
    let ctx;
    let task;
    let batchParams;
    let revisions;

    beforeEach(async () => {
      users = [
        { _id: 'user-id-1', username: 'username1' },
        { _id: 'user-id-2', username: 'username2' }
      ];
      task = {
        taskParams: {
          key: 'key',
          importedRevision: 'rev-1',
          importableRevision: 'rev-4'
        }
      };
      batchParams = { hostName: 'host.name' };
      const revision1 = {
        _id: 'rev-1',
        key: 'key',
        createdBy: users[0]._id,
        order: 1,
        sections: [],
        cdnResources: ['resource-1']
      };
      const revision2 = {
        _id: 'rev-2',
        key: 'key',
        createdBy: users[1]._id,
        order: 2,
        sections: [],
        cdnResources: ['resource-2']
      };
      revisions = [revision2, revision1];
      ctx = { cancellationRequested: false };

      exportApiClient.getDocumentExport.resolves({ revisions, users, cdnRootUrl: 'https://cdn.root.url' });

      userService.getUserById.withArgs(users[0]._id).resolves(users[0]);
      userService.getUserById.withArgs(users[1]._id).resolves(users[1]);

      documentService.getCurrentDocumentRevisionByKey.onCall(0).resolves(null);
      documentService.getCurrentDocumentRevisionByKey.onCall(1).resolves(revision1);

      cdn.uploadObjectFromUrl.resolves();

      documentService.copyDocumentRevision.resolves();

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

    it('should call cdn.uploadObjectFromUrl all cdn resources', () => {
      sinon.assert.calledWith(cdn.uploadObjectFromUrl.firstCall, 'resource-1', 'https://cdn.root.url/resource-1');
      sinon.assert.calledWith(cdn.uploadObjectFromUrl.secondCall, 'resource-2', 'https://cdn.root.url/resource-2');
    });

    it('should call documentService.copyDocumentRevision for each mapped revision, sorted by order', () => {
      sinon.assert.calledWith(documentService.copyDocumentRevision.firstCall, {
        doc: {
          _id: 'rev-1',
          key: 'key',
          createdBy: users[0]._id,
          order: 1,
          sections: [],
          cdnResources: ['resource-1'],
          origin: 'external/host.name',
          originUrl: 'https://host.name/docs/key',
          appendTo: null
        },
        user: users[0],
        databaseSession: sinon.match.any
      });
      sinon.assert.calledWith(documentService.copyDocumentRevision.secondCall, {
        doc: {
          _id: 'rev-2',
          key: 'key',
          createdBy: users[1]._id,
          order: 2,
          sections: [],
          cdnResources: ['resource-2'],
          origin: 'external/host.name',
          originUrl: 'https://host.name/docs/key',
          appendTo: {
            key: 'key',
            ancestorId: 'rev-1'
          }
        },
        user: users[1],
        databaseSession: sinon.match.any
      });
    });
  });

});
