/* eslint-disable max-lines */
import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import UserService from './user-service.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import ServerConfig from '../bootstrap/server-config.js';
import ExportApiClient from '../api-clients/export-api-client.js';
import DocumentImportTaskProcessor from './document-import-task-processor.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment } from '../test-helper.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../domain/constants.js';

describe('document-import-task-processor', () => {
  const now = new Date();
  const sandbox = sinon.createSandbox();

  let db;
  let sut;
  let cdn;
  let container;
  let userService;
  let serverConfig;
  let importSource;
  let exportApiClient;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    db = container.get(Database);
    userService = container.get(UserService);
    serverConfig = container.get(ServerConfig);
    exportApiClient = container.get(ExportApiClient);

    sut = container.get(DocumentImportTaskProcessor);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);

    importSource = { hostName: 'host.name', allowUnsecure: false, apiKey: 'FG5GFDFR352DFS' };
    sandbox.stub(serverConfig, 'importSources').value([importSource]);
    sandbox.stub(exportApiClient, 'getDocumentExport');
    sandbox.stub(userService, 'ensureInternalUser');
    sandbox.stub(cdn, 'objectExists').resolves(false);
    sandbox.stub(cdn, 'uploadObjectFromUrl').resolves();
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
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
    let documentId;

    describe('a task to import a new document', () => {
      let importedRevisions;

      beforeEach(async () => {
        documentId = uniqueId.create();

        batchParams = { hostName: 'host.name', nativeImport: false };
        cdnRootUrl = 'https://cdn.integration.openmusic.academy';

        user1 = { _id: uniqueId.create(), displayName: 'User 1' };
        user2 = { _id: uniqueId.create(), displayName: 'User 2' };

        revision1 = {
          _id: uniqueId.create(),
          documentId,
          roomId: null,
          description: 'Description 1',
          slug: 'slug-1',
          tags: ['tag-1'],
          title: 'title-1',
          createdBy: user1._id,
          language: 'de',
          order: 1000,
          sections: [
            {
              revision: uniqueId.create(),
              key: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-1.mp4',
                copyrightNotice: '',
                aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
                posterImage: {
                  sourceType: MEDIA_SOURCE_TYPE.internal,
                  sourceUrl: ''
                },
                width: 100
              },
              deletedOn: null,
              deletedBy: null,
              deletedBecause: null
            }
          ],
          review: 'review',
          verified: true,
          allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content,
          restoredFrom: uniqueId.create(),
          cdnResources: ['media/video-1.mp4']
        };

        revision2 = {
          _id: uniqueId.create(),
          documentId,
          roomId: null,
          description: 'Description 2',
          slug: 'slug-2',
          tags: ['tag-2'],
          title: 'title-2',
          createdBy: user2._id,
          language: 'en',
          order: 2000,
          sections: [
            {
              revision: uniqueId.create(),
              key: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-2.mp4',
                copyrightNotice: '',
                aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
                posterImage: {
                  sourceType: MEDIA_SOURCE_TYPE.internal,
                  sourceUrl: ''
                },
                width: 100
              },
              deletedOn: null,
              deletedBy: null,
              deletedBecause: null
            }
          ],
          review: 'review',
          verified: true,
          allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent,
          restoredFrom: uniqueId.create(),
          cdnResources: ['media/video-2.mp4']
        };
        task = {
          taskParams: {
            documentId
          }
        };

        exportApiClient.getDocumentExport.resolves({
          revisions: [revision2, revision1],
          users: [user1, user2],
          cdnRootUrl
        });

        ctx = { cancellationRequested: false };
        await sut.process(task, batchParams, ctx);

        importedRevisions = await db.documentRevisions.find({ documentId }, { sort: [['order', 1]] }).toArray();
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: `https://${batchParams.hostName}`,
          apiKey: importSource.apiKey,
          documentId: task.taskParams.documentId,
          includeEmails: false
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
          organization: '',
          introduction: '',
          provider: `external/${batchParams.hostName}`,
          roles: [],
          displayName: user1.displayName,
          verificationCode: null
        });
        expect(importedUser2).toMatchObject({
          _id: user2._id,
          email: null,
          expires: null,
          lockedOut: false,
          passwordHash: null,
          organization: '',
          introduction: '',
          provider: `external/${batchParams.hostName}`,
          roles: [],
          displayName: user2.displayName,
          verificationCode: null
        });
      });

      it('should upload the CDN resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision1.cdnResources[0], `${cdnRootUrl}/${revision1.cdnResources[0]}`);
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision2.cdnResources[0], `${cdnRootUrl}/${revision2.cdnResources[0]}`);
      });

      it('should create the revisions', () => {
        expect(importedRevisions).toMatchObject([
          {
            ...revision1,
            sections: [
              {
                ...revision1.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-2`,
            cdnResources: ['media/video-1.mp4'],
            archived: false
          },
          {
            ...revision2,
            sections: [
              {
                ...revision2.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order + 1,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-2`,
            cdnResources: ['media/video-2.mp4'],
            archived: false
          }
        ]);
      });

      it('should create the document', async () => {
        const importedDocument = await db.documents.findOne({ _id: documentId });
        const expectedDocument = {
          ...revision2,
          sections: [
            {
              ...revision2.sections[0],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          _id: documentId,
          revision: revision2._id,
          createdOn: now,
          createdBy: revision1.createdBy,
          updatedOn: now,
          updatedBy: revision2.createdBy,
          order: importedRevisions[1].order,
          origin: `external/${batchParams.hostName}`,
          originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-2`,
          cdnResources: ['media/video-2.mp4'],
          archived: false,
          contributors: [user1._id, user2._id]
        };
        delete expectedDocument.documentId;
        delete expectedDocument.restoredFrom;

        expect(importedDocument).toMatchObject(expectedDocument);
      });
    });

    describe('consecutive tasks to import the same document (with new revisions added in the meantime)', () => {
      let importedRevisions;

      beforeEach(async () => {
        task = {
          taskParams: {
            documentId
          }
        };
        ctx = { cancellationRequested: false };

        exportApiClient.getDocumentExport.resolves({
          revisions: [revision2, revision1],
          users: [user1, user2],
          cdnRootUrl
        });
        await sut.process(task, batchParams, ctx);

        user3 = { _id: uniqueId.create(), displayName: 'User 3' };
        revision3 = {
          _id: uniqueId.create(),
          documentId,
          roomId: null,
          description: 'Description 3',
          slug: 'slug-3',
          tags: ['tag-3'],
          title: 'title-3',
          createdBy: user3._id,
          language: 'de',
          order: 3000,
          sections: [
            {
              revision: uniqueId.create(),
              key: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-3.mp4',
                copyrightNotice: '',
                aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
                posterImage: {
                  sourceType: MEDIA_SOURCE_TYPE.internal,
                  sourceUrl: ''
                },
                width: 100
              },
              deletedOn: null,
              deletedBy: null,
              deletedBecause: null
            }
          ],
          review: 'review',
          verified: true,
          allowedOpenContribution: DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content,
          cdnResources: ['media/video-3.mp4']
        };
        exportApiClient.getDocumentExport.resolves({
          revisions: [revision1, revision2, revision3],
          users: [user3],
          cdnRootUrl
        });
        await sut.process(task, batchParams, ctx);

        importedRevisions = await db.documentRevisions.find({ documentId }, { sort: [['order', 1]] }).toArray();
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: `https://${batchParams.hostName}`,
          apiKey: importSource.apiKey,
          documentId: task.taskParams.documentId,
          includeEmails: false
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
          organization: '',
          introduction: '',
          provider: `external/${batchParams.hostName}`,
          roles: [],
          displayName: user3.displayName,
          verificationCode: null
        });
      });

      it('should upload the CDN resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision3.cdnResources[0], `${cdnRootUrl}/${revision3.cdnResources[0]}`);
      });

      it('should re-create the existing revisions and add the new one', () => {
        expect(importedRevisions).toMatchObject([
          {
            ...revision1,
            sections: [
              {
                ...revision1.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-3`,
            cdnResources: ['media/video-1.mp4'],
            archived: false
          },
          {
            ...revision2,
            sections: [
              {
                ...revision2.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order + 1,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-3`,
            cdnResources: ['media/video-2.mp4'],
            archived: false
          },
          {
            ...revision3,
            sections: [
              {
                ...revision3.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order + 2,
            origin: `external/${batchParams.hostName}`,
            originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-3`,
            cdnResources: ['media/video-3.mp4'],
            archived: false
          }
        ]);
      });

      it('should update the document', async () => {
        const importedDocument = await db.documents.findOne({ _id: documentId });
        const expectedDocument = {
          ...revision3,
          sections: [
            {
              ...revision3.sections[0],
              revision: expect.stringMatching(/\w+/)
            }
          ],
          _id: documentId,
          revision: revision3._id,
          createdOn: now,
          createdBy: revision1.createdBy,
          updatedOn: now,
          updatedBy: revision3.createdBy,
          order: importedRevisions[2].order,
          origin: `external/${batchParams.hostName}`,
          originUrl: `https://${batchParams.hostName}/docs/${documentId}/slug-3`,
          cdnResources: ['media/video-3.mp4'],
          archived: false,
          contributors: [user1._id, user2._id, user3._id]
        };
        delete expectedDocument.documentId;

        expect(importedDocument).toMatchObject(expectedDocument);
      });
    });

    describe('a task to import a new document as native', () => {
      let user1ImportingSystem;
      let importedRevisions;

      beforeEach(async () => {
        documentId = uniqueId.create();

        batchParams = { hostName: 'host.name', nativeImport: true };
        cdnRootUrl = 'https://cdn.integration.openmusic.academy';

        user1 = { _id: uniqueId.create(), displayName: 'User 1', email: 'user1@test.com' };
        user2 = { _id: uniqueId.create(), displayName: 'User 2', email: 'user2@test.com' };

        user1ImportingSystem = { _id: uniqueId.create(), displayName: 'User 1', email: 'user1@test.com' };

        userService.ensureInternalUser
          .withArgs({ _id: user1._id, displayName: user1.displayName, email: user1.email })
          .resolves(user1ImportingSystem._id);
        userService.ensureInternalUser
          .withArgs({ _id: user2._id, displayName: user2.displayName, email: user2.email })
          .resolves(user2._id);

        revision1 = {
          _id: uniqueId.create(),
          documentId,
          slug: 'slug-1',
          tags: ['tag-1'],
          title: 'title-1',
          createdBy: user1._id,
          language: 'de',
          order: 1000,
          sections: [
            {
              revision: uniqueId.create(),
              key: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-1.mp4',
                copyrightNotice: '',
                aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
                posterImage: {
                  sourceType: MEDIA_SOURCE_TYPE.internal,
                  sourceUrl: ''
                },
                width: 100
              },
              deletedOn: null,
              deletedBy: null,
              deletedBecause: null
            }
          ],
          restoredFrom: uniqueId.create(),
          cdnResources: ['media/video-1.mp4']
        };

        revision2 = {
          _id: uniqueId.create(),
          documentId,
          slug: 'slug-2',
          tags: ['tag-2'],
          title: 'title-2',
          createdBy: user2._id,
          language: 'en',
          order: 2000,
          sections: [
            {
              revision: uniqueId.create(),
              key: uniqueId.create(),
              type: 'video',
              content: {
                sourceType: MEDIA_SOURCE_TYPE.internal,
                sourceUrl: 'media/video-2.mp4',
                copyrightNotice: '',
                aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
                posterImage: {
                  sourceType: MEDIA_SOURCE_TYPE.internal,
                  sourceUrl: ''
                },
                width: 100
              },
              deletedOn: null,
              deletedBy: user1._id,
              deletedBecause: null
            }
          ],
          cdnResources: ['media/video-2.mp4']
        };
        task = {
          taskParams: {
            documentId
          }
        };

        exportApiClient.getDocumentExport.resolves({
          revisions: [revision2, revision1],
          users: [user1, user2],
          cdnRootUrl
        });

        ctx = { cancellationRequested: false };
        await sut.process(task, batchParams, ctx);
        importedRevisions = await db.documentRevisions.find({ documentId }, { sort: [['order', 1]] }).toArray();
      });

      it('should call exportApiClient.getDocumentExport', () => {
        sinon.assert.calledWith(exportApiClient.getDocumentExport, {
          baseUrl: `https://${batchParams.hostName}`,
          apiKey: importSource.apiKey,
          documentId: task.taskParams.documentId,
          includeEmails: true
        });
      });

      it('should upload the CDN resources', () => {
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision1.cdnResources[0], `${cdnRootUrl}/${revision1.cdnResources[0]}`);
        sinon.assert.calledWith(cdn.uploadObjectFromUrl, revision2.cdnResources[0], `${cdnRootUrl}/${revision2.cdnResources[0]}`);
      });

      it('should create the revisions', () => {
        expect(importedRevisions).toMatchObject([
          {
            ...revision1,
            createdBy: user1ImportingSystem._id,
            sections: [
              {
                ...revision1.sections[0],
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order,
            origin: 'internal',
            originUrl: null,
            cdnResources: ['media/video-1.mp4'],
            archived: false
          },
          {
            ...revision2,
            sections: [
              {
                ...revision2.sections[0],
                deletedBy: user1ImportingSystem._id,
                revision: expect.stringMatching(/\w+/)
              }
            ],
            createdOn: now,
            order: importedRevisions[0].order + 1,
            origin: 'internal',
            originUrl: null,
            cdnResources: ['media/video-2.mp4'],
            archived: false
          }
        ]);
      });

      it('should create the document', async () => {
        const importedDocument = await db.documents.findOne({ _id: documentId });
        const expectedDocument = {
          ...revision2,
          sections: [
            {
              ...revision2.sections[0],
              deletedBy: user1ImportingSystem._id,
              revision: expect.stringMatching(/\w+/)
            }
          ],
          _id: documentId,
          revision: revision2._id,
          createdOn: now,
          createdBy: user1ImportingSystem._id,
          updatedOn: now,
          updatedBy: user2._id,
          order: importedRevisions[1].order,
          origin: 'internal',
          originUrl: null,
          cdnResources: ['media/video-2.mp4'],
          archived: false,
          contributors: [user1ImportingSystem._id, user2._id]
        };
        delete expectedDocument.documentId;

        expect(importedDocument).toMatchObject(expectedDocument);
      });
    });

  });

});
