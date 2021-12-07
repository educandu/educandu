import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import ExportApiClient from './export-api-client.js';
import ServerConfig from '../bootstrap/server-config.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import { SOURCE_TYPE as VIDEO_SOURCE_TYPE } from '../plugins/video/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';

describe('document-import-task-processor', () => {
  const sandbox = sinon.createSandbox();

  let db;
  let sut;
  let cdn;
  let container;
  let serverConfig;
  let importSource;
  let exportApiClient;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    db = container.get(Database);
    serverConfig = container.get(ServerConfig);
    exportApiClient = container.get(ExportApiClient);

    sut = container.get(DocumentImportTaskProcessor);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  describe('process', () => {
    let ctx;
    let task;
    let user1;
    let user2;
    let user3;
    let revision1;
    let revision2;
    let revision3;
    let cdnRootUrl;
    let batchParams;
    let documentKey;

    const now = new Date();

    beforeEach(() => {
      sandbox.useFakeTimers(now);

      importSource = { hostName: 'host.name', allowUnsecure: false, apiKey: 'FG5GFDFR352DFS' };
      sandbox.stub(serverConfig, 'importSources').value([importSource]);
      sandbox.stub(exportApiClient, 'getDocumentExport');
      sandbox.stub(cdn, 'objectExists').resolves(false);
      sandbox.stub(cdn, 'uploadObjectFromUrl').resolves();
    });

    afterEach(async () => {
      await pruneTestEnvironment(container);
      sandbox.restore();
    });

    describe('a task to import a new document', () => {
      beforeEach(async () => {
        documentKey = uniqueId.create();

        batchParams = { hostName: 'host.name' };
        cdnRootUrl = 'https://cdn.integration.openmusic.academy';

        user1 = { _id: 'user-id-1', username: 'username-1' };
        user2 = { _id: 'user-id-2', username: 'username-2' };

        revision1 = {
          _id: uniqueId.create(),
          key: documentKey,
          slug: 'slug-1',
          tags: ['tag-1'],
          title: 'title-1',
          namespace: 'articles',
          createdBy: user1._id,
          language: 'de',
          order: 1000,
          sections: [
            {
              key: uniqueId.create(),
              type: 'video',
              content: {
                type: VIDEO_SOURCE_TYPE.internal,
                url: 'media/video-1.mp4'
              }
            }
          ],
          restoredFrom: uniqueId.create(),
          cdnResources: ['media/video-1.mp4']
        };

        revision2 = {
          _id: uniqueId.create(),
          key: documentKey,
          slug: 'slug-2',
          tags: ['tag-2'],
          title: 'title-2',
          namespace: 'articles',
          createdBy: user2._id,
          language: 'en',
          order: 2000,
          sections: [
            {
              key: uniqueId.create(),
              type: 'video',
              content: {
                type: VIDEO_SOURCE_TYPE.internal,
                url: 'media/video-2.mp4'
              }
            }
          ],
          cdnResources: ['media/video-2.mp4']
        };
        task = {
          taskParams: {
            key: documentKey,
            importedRevision: null,
            importableRevision: revision2._id
          }
        };

        exportApiClient.getDocumentExport.resolves({
          revisions: [revision2, revision1],
          users: [user1, user2],
          cdnRootUrl
        });

        ctx = { cancellationRequested: false };
        await sut.process(task, batchParams, ctx);
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: `https://${batchParams.hostName}`,
          apiKey: importSource.apiKey,
          documentKey: task.taskParams.key,
          afterRevision: task.taskParams.importedRevision,
          toRevision: task.taskParams.importableRevision
        });
      });

      it('should create the users', async () => {
        const importedUser1 = await db.users.findOne({ _id: user1._id });
        const importedUser2 = await db.users.findOne({ _id: user2._id });
        expect(importedUser1).toMatchObject({
          _id: user1._id,
          email: null,
          expires: null,
          lockedOut: false,
          passwordHash: null,
          profile: null,
          provider: `external/${batchParams.hostName}`,
          roles: [],
          username: user1.username,
          verificationCode: null
        });
        expect(importedUser2).toMatchObject({
          _id: user2._id,
          email: null,
          expires: null,
          lockedOut: false,
          passwordHash: null,
          profile: null,
          provider: `external/${batchParams.hostName}`,
          roles: [],
          username: user2.username,
          verificationCode: null
        });
      });

      it('should upload the CDN resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision1.cdnResources[0], `${cdnRootUrl}/${revision1.cdnResources[0]}`);
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision2.cdnResources[0], `${cdnRootUrl}/${revision2.cdnResources[0]}`);
      });

      it('should create the revisions', async () => {
        const importedRevisions = await db.documentRevisions.find({ key: documentKey }).toArray();
        expect(importedRevisions).toMatchObject([
          {
            ...revision1,
            createdOn: now,
            order: 1,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentKey}/slug-1`,
            cdnResources: ['media/video-1.mp4'],
            archived: false
          },
          {
            ...revision2,
            createdOn: now,
            order: 2,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentKey}/slug-1`,
            cdnResources: ['media/video-2.mp4'],
            archived: false
          }
        ]);
      });

      it('should create the document', async () => {
        const importedDocument = await db.documents.findOne({ key: documentKey });
        expect(importedDocument).toMatchObject({
          ...revision2,
          _id: documentKey,
          revision: revision2._id,
          createdOn: now,
          createdBy: revision1.createdBy,
          updatedOn: now,
          updatedBy: revision2.createdBy,
          order: 2,
          origin: `external/${batchParams.hostName}`,
          originUrl: `https://${batchParams.hostName}/docs/${documentKey}/slug-1`,
          cdnResources: ['media/video-2.mp4'],
          archived: false,
          contributors: [user1._id, user2._id]
        });
      });

      describe('followed by a task to update the document', () => {

        beforeEach(async () => {
          user3 = { _id: 'user-id-3', username: 'username-3' };

          revision3 = {
            _id: uniqueId.create(),
            key: documentKey,
            slug: 'slug-3',
            tags: ['tag-3'],
            title: 'title-3',
            namespace: 'articles',
            createdBy: user3._id,
            language: 'de',
            order: 3000,
            sections: [
              {
                key: uniqueId.create(),
                type: 'video',
                content: {
                  type: VIDEO_SOURCE_TYPE.internal,
                  url: 'media/video-3.mp4'
                }
              }
            ],
            cdnResources: ['media/video-3.mp4']
          };

          task = {
            taskParams: {
              key: documentKey,
              importedRevision: revision2._id,
              importableRevision: revision3._id
            }
          };

          exportApiClient.getDocumentExport.resolves({
            revisions: [revision3],
            users: [user3],
            cdnRootUrl
          });

          ctx = { cancellationRequested: false };
          await sut.process(task, batchParams, ctx);
        });

        it('should call exportApiClient.getDocumentExport', () => {
          sinon.assert.calledWith(exportApiClient.getDocumentExport, {
            baseUrl: `https://${batchParams.hostName}`,
            apiKey: importSource.apiKey,
            documentKey: task.taskParams.key,
            afterRevision: task.taskParams.importedRevision,
            toRevision: task.taskParams.importableRevision
          });
        });

        it('should create the users', async () => {
          const importedUser3 = await db.users.findOne({ _id: user3._id });
          expect(importedUser3).toMatchObject({
            _id: user3._id,
            email: null,
            expires: null,
            lockedOut: false,
            passwordHash: null,
            profile: null,
            provider: `external/${batchParams.hostName}`,
            roles: [],
            username: user3.username,
            verificationCode: null
          });
        });

        it('should upload the CDN resources', () => {
          sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision3.cdnResources[0], `${cdnRootUrl}/${revision3.cdnResources[0]}`);
        });

        it('should create the revisions', async () => {
          const importedRevision3 = await db.documentRevisions.findOne({ _id: revision3._id });
          expect(importedRevision3).toMatchObject({
            ...revision3,
            createdOn: now,
            order: 3,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentKey}/slug-3`,
            cdnResources: ['media/video-3.mp4'],
            archived: false
          });
        });

        it('should update the document', async () => {
          const importedDocument = await db.documents.findOne({ key: documentKey });
          expect(importedDocument).toMatchObject({
            ...revision3,
            _id: documentKey,
            revision: revision3._id,
            createdOn: now,
            createdBy: revision1.createdBy,
            updatedOn: now,
            updatedBy: revision3.createdBy,
            order: 3,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentKey}/slug-3`,
            cdnResources: ['media/video-3.mp4'],
            archived: false,
            contributors: [user1._id, user2._id, user3._id]
          });
        });
      });
    });

  });

});
