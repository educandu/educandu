/* eslint-disable max-lines */
import sinon from 'sinon';
import Cdn from '../repositories/cdn.js';
import Database from '../stores/database.js';
import uniqueId from '../utils/unique-id.js';
import RoomStore from '../stores/room-store.js';
import LockStore from '../stores/lock-store.js';
import StorageService from './storage-service.js';
import CommentStore from '../stores/comment-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import RoomInvitationStore from '../stores/room-invitation-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { CDN_OBJECT_TYPE, ROLE, ROOM_DOCUMENTS_MODE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { destroyTestEnvironment, pruneTestEnvironment, setupTestEnvironment, setupTestUser } from '../test-helper.js';

describe('storage-service', () => {
  const sandbox = sinon.createSandbox();

  let documentRevisionStore;
  let roomInvitationStore;
  let documentStore;
  let commentStore;
  let serverConfig;
  let storagePlan;
  let roomStore;
  let lockStore;
  let container;
  let roomId;
  let myUser;
  let files;
  let cdn;
  let sut;
  let db;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    cdn = container.get(Cdn);
    lockStore = container.get(LockStore);
    roomStore = container.get(RoomStore);
    commentStore = container.get(CommentStore);
    serverConfig = container.get(ServerConfig);
    documentStore = container.get(DocumentStore);
    roomInvitationStore = container.get(RoomInvitationStore);
    documentRevisionStore = container.get(DocumentRevisionStore);

    db = container.get(Database);
    sut = container.get(StorageService);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  beforeEach(async () => {
    sandbox.stub(cdn, 'listObjects');
    sandbox.stub(cdn, 'uploadObject');
    sandbox.stub(cdn, 'deleteObjects');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(lockStore, 'takeUserLock');
    sandbox.stub(documentStore, 'deleteDocumentsByRoomId');
    sandbox.stub(documentStore, 'getDocumentById');
    sandbox.stub(documentStore, 'getDocumentsMetadataByRoomId');
    sandbox.stub(documentRevisionStore, 'deleteDocumentsByRoomId');
    sandbox.stub(documentStore, 'getDocumentsMetadataByConditions');
    sandbox.stub(roomStore, 'getRoomById');
    sandbox.stub(roomStore, 'deleteRoomById');
    sandbox.stub(roomStore, 'getRoomIdsByOwnerId');
    sandbox.stub(roomStore, 'getRoomsByOwnerOrCollaboratorUser');
    sandbox.stub(roomInvitationStore, 'deleteRoomInvitationsByRoomId');
    sandbox.stub(commentStore, 'deleteCommentsByDocumentIds');

    roomId = uniqueId.create();
    storagePlan = { _id: uniqueId.create(), name: 'test-plan', maxBytes: 10 * 1000 * 1000 };
    await db.storagePlans.insertOne(storagePlan);

    myUser = await setupTestUser(container, { email: 'i@myself.com', displayName: 'Me' });
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getObjects', () => {
    let rooms;
    let documents;

    beforeEach(() => {
      sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.domain.com');
      documentStore.getDocumentsMetadataByConditions.resolves([]);
      roomStore.getRoomsByOwnerOrCollaboratorUser.resolves([]);
    });

    describe('when neither the current directory nor the parent directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.resolves([
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-1.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-2 with spaces.pdf', size: 2000, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: null, name: 'media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf', size: 3000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);
        rooms = [];
        documents = [{ _id: '34q87zc95t9c287eh', title: 'Document title' }];

        roomStore.getRoomsByOwnerOrCollaboratorUser.withArgs({ userId: myUser._id }).resolves(rooms);
        documentStore.getDocumentsMetadataByConditions.withArgs([]).resolves(documents);

        result = await sut.getObjects({ parentPath: 'media/34q87zc95t9c287eh', user: myUser });
      });

      it('should call the CDN', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: 'media/34q87zc95t9c287eh/', recursive: false });
      });

      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: {
            displayName: 'media',
            parentPath: '',
            path: 'media',
            url: 'https://cdn.domain.com/media',
            portableUrl: 'cdn://media',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          currentDirectory: {
            displayName: '34q87zc95t9c287eh',
            parentPath: 'media',
            path: 'media/34q87zc95t9c287eh',
            url: 'https://cdn.domain.com/media/34q87zc95t9c287eh',
            portableUrl: 'cdn://media/34q87zc95t9c287eh',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null,
            documentMetadata: {
              title: 'Document title',
              isAccessibleToUser: true
            }
          },
          objects: [
            {
              displayName: 'file-1.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-1.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-1.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-1.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000,
              documentMetadata: null
            },
            {
              displayName: 'file-2 with spaces.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-2 with spaces.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-2%20with%20spaces.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 2000,
              documentMetadata: null
            },
            {
              displayName: 'file-3 with weird &$#=.pdf',
              parentPath: 'media/34q87zc95t9c287eh',
              path: 'media/34q87zc95t9c287eh/file-3 with weird &$#=.pdf',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
              portableUrl: 'cdn://media/34q87zc95t9c287eh/file-3%20with%20weird%20%26%24%23%3D.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 3000,
              documentMetadata: null
            }
          ]
        });
      });
    });

    describe('when the parent directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.resolves([
          { prefix: 'media/34q87zc95t9c287eh/', name: null, size: null, lastModified: null },
          { prefix: 'media/43vzvjz05tzdfz7rf/', name: null, size: null, lastModified: null },
          { prefix: null, name: 'media/some-file.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);

        rooms = [{ _id: 'Room ID', owner: myUser._id }];
        documents = [
          { _id: '34q87zc95t9c287eh', title: 'Document1 title', roomId: 'Room ID' },
          { _id: '43vzvjz05tzdfz7rf', title: 'Document2 title', roomId: 'Other room ID' }
        ];

        documentStore.getDocumentsMetadataByConditions.withArgs([]).resolves(documents);
        roomStore.getRoomsByOwnerOrCollaboratorUser.withArgs({ userId: myUser._id }).resolves(rooms);

        result = await sut.getObjects({ parentPath: 'media', user: myUser });
      });

      it('should call the CDN', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: 'media/', recursive: false });
      });

      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: {
            displayName: '',
            parentPath: null,
            path: '',
            url: 'https://cdn.domain.com',
            portableUrl: 'cdn://',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null
          },
          currentDirectory: {
            displayName: 'media',
            parentPath: '',
            path: 'media',
            url: 'https://cdn.domain.com/media',
            portableUrl: 'cdn://media',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null,
            documentMetadata: null
          },
          objects: [
            {
              displayName: '34q87zc95t9c287eh',
              parentPath: 'media',
              path: 'media/34q87zc95t9c287eh',
              url: 'https://cdn.domain.com/media/34q87zc95t9c287eh',
              portableUrl: 'cdn://media/34q87zc95t9c287eh',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null,
              documentMetadata: {
                title: 'Document1 title',
                isAccessibleToUser: true
              }
            },
            {
              displayName: '43vzvjz05tzdfz7rf',
              parentPath: 'media',
              path: 'media/43vzvjz05tzdfz7rf',
              url: 'https://cdn.domain.com/media/43vzvjz05tzdfz7rf',
              portableUrl: 'cdn://media/43vzvjz05tzdfz7rf',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null,
              documentMetadata: {
                title: '',
                isAccessibleToUser: false
              }
            },
            {
              displayName: 'some-file.pdf',
              parentPath: 'media',
              path: 'media/some-file.pdf',
              url: 'https://cdn.domain.com/media/some-file.pdf',
              portableUrl: 'cdn://media/some-file.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000,
              documentMetadata: null
            }
          ]
        });
      });
    });

    describe('when the current directory is the root', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.resolves([
          { prefix: 'media/', name: null, size: null, lastModified: null },
          { prefix: null, name: 'some-file.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);

        result = await sut.getObjects({ parentPath: '', user: myUser });
      });

      it('should call the CDN', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: '', recursive: false });
      });

      it('should construct all paths and URLs correctly', () => {
        expect(result).toStrictEqual({
          parentDirectory: null,
          currentDirectory: {
            displayName: '',
            parentPath: null,
            path: '',
            url: 'https://cdn.domain.com',
            portableUrl: 'cdn://',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null,
            documentMetadata: null
          },
          objects: [
            {
              displayName: 'media',
              parentPath: '',
              path: 'media',
              url: 'https://cdn.domain.com/media',
              portableUrl: 'cdn://media',
              createdOn: null,
              type: CDN_OBJECT_TYPE.directory,
              size: null,
              documentMetadata: null
            },
            {
              displayName: 'some-file.pdf',
              parentPath: '',
              path: 'some-file.pdf',
              url: 'https://cdn.domain.com/some-file.pdf',
              portableUrl: 'cdn://some-file.pdf',
              createdOn: '2022-06-09T12:00:00.000Z',
              type: CDN_OBJECT_TYPE.file,
              size: 1000,
              documentMetadata: null
            }
          ]
        });
      });
    });

    describe('when a search term is provided', () => {
      let result;
      beforeEach(async () => {
        cdn.listObjects.withArgs({ prefix: 'media/', recursive: false }).resolves([
          { prefix: 'media/22UGLkp4qDw4CF6siL7SeU/', size: 0, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: 'media/34q87zc95t9c287ehHJSRI/', size: 0, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: 'media/4Z9xUe4LS8t7xysHNquoyE/', size: 0, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: 'media/5oGzxk5GU2eW5VePfPk4cr/', size: 0, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);
        cdn.listObjects.withArgs({ prefix: 'media/', recursive: true }).resolves([
          { prefix: null, name: 'media/4Z9xUe4LS8t7xysHNquoyE/music-file-1.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { prefix: null, name: 'media/4Z9xUe4LS8t7xysHNquoyE/music-file-2.pdf', size: 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ]);
        documentStore.getDocumentsMetadataByConditions.resolves([
          { _id: '22UGLkp4qDw4CF6siL7SeU', title: 'Music accessible', roomId: 'RAYUo2abjwu9hyt4XW97UC' },
          { _id: '34q87zc95t9c287ehHJSRI', title: 'Music inaccessible', roomId: 'RN3TsCRZHPhUKswD1jqu9' },
          { _id: '4Z9xUe4LS8t7xysHNquoyE', title: 'Singing' },
          { _id: '5oGzxk5GU2eW5VePfPk4cr', title: 'Other accessible topic', roomId: 'RAYUo2abjwu9hyt4XW97UC' }
        ]);
        roomStore.getRoomsByOwnerOrCollaboratorUser.resolves([
          {
            _id: 'RAYUo2abjwu9hyt4XW97UC'
          }
        ]);

        result = await sut.getObjects({ parentPath: 'media', user: myUser, searchTerm: 'music' });
      });

      it('should call the CDN once for the current level objects', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: 'media/', recursive: false });
      });

      it('should call the CDN once for the inner levels objects', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: 'media/', recursive: true });
      });

      it('should construct parentDirectory correctly', () => {
        expect(result.parentDirectory).toStrictEqual({
          displayName: '',
          parentPath: null,
          path: '',
          url: 'https://cdn.domain.com',
          portableUrl: 'cdn://',
          createdOn: null,
          size: null,
          type: CDN_OBJECT_TYPE.directory
        });
      });

      it('should construct currentDirectory correctly', () => {
        expect(result.currentDirectory).toStrictEqual({
          displayName: 'media',
          parentPath: '',
          path: 'media',
          url: 'https://cdn.domain.com/media',
          portableUrl: 'cdn://media',
          createdOn: null,
          type: CDN_OBJECT_TYPE.directory,
          size: null,
          documentMetadata: null
        });
      });

      it('should construct all (matching and accessbile) objects correctly', () => {
        expect(result.objects).toStrictEqual([
          {
            displayName: '22UGLkp4qDw4CF6siL7SeU',
            parentPath: 'media',
            path: 'media/22UGLkp4qDw4CF6siL7SeU',
            url: 'https://cdn.domain.com/media/22UGLkp4qDw4CF6siL7SeU',
            portableUrl: 'cdn://media/22UGLkp4qDw4CF6siL7SeU',
            createdOn: null,
            type: CDN_OBJECT_TYPE.directory,
            size: null,
            documentMetadata: {
              isAccessibleToUser: true,
              title: 'Music accessible'
            }
          },
          {
            displayName: 'music-file-1.pdf',
            parentPath: 'media/4Z9xUe4LS8t7xysHNquoyE',
            path: 'media/4Z9xUe4LS8t7xysHNquoyE/music-file-1.pdf',
            url: 'https://cdn.domain.com/media/4Z9xUe4LS8t7xysHNquoyE/music-file-1.pdf',
            portableUrl: 'cdn://media/4Z9xUe4LS8t7xysHNquoyE/music-file-1.pdf',
            createdOn: '2022-06-09T12:00:00.000Z',
            type: CDN_OBJECT_TYPE.file,
            size: 1000
          },
          {
            displayName: 'music-file-2.pdf',
            parentPath: 'media/4Z9xUe4LS8t7xysHNquoyE',
            path: 'media/4Z9xUe4LS8t7xysHNquoyE/music-file-2.pdf',
            url: 'https://cdn.domain.com/media/4Z9xUe4LS8t7xysHNquoyE/music-file-2.pdf',
            portableUrl: 'cdn://media/4Z9xUe4LS8t7xysHNquoyE/music-file-2.pdf',
            createdOn: '2022-06-09T12:00:00.000Z',
            size: 1000,
            type: CDN_OBJECT_TYPE.file
          }
        ]);
      });
    });
  });

  describe('uploadFiles', () => {
    let lock;
    let result;
    let parentPath;

    beforeEach(() => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();
      sandbox.stub(serverConfig, 'cdnRootUrl').value('https://cdn.domain.com');
    });

    describe('when the storage type is unknown', () => {
      beforeEach(async () => {
        parentPath = 'other-path/media';
        files = [{}];

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe(`Invalid storage path '${parentPath}'`);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is public', () => {
      const id = 'xyz';
      const docId = uniqueId.create();

      let filesAfterUpload;

      beforeEach(async () => {
        parentPath = `media/${docId}`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        filesAfterUpload = [
          { name: `media/${docId}/file1-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `media/${docId}/file2-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        cdn.listObjects.withArgs({ prefix: `media/${docId}/`, recursive: true }).resolves(filesAfterUpload);
        cdn.listObjects.resolves([]);

        cdn.uploadObject.resolves();

        sandbox.stub(uniqueId, 'create').returns(id);
        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, `media/${docId}/file1-${id}.jpeg`, files[0].path);
        sinon.assert.calledWith(cdn.uploadObject, `media/${docId}/file2-${id}.jpeg`, files[1].path);
      });

      it('should release the lock', () => {
        sinon.assert.calledWith(lockStore.releaseLock, lock);
      });

      it('should return zero used bytes', () => {
        expect(result).toEqual({ uploadedFiles: expect.any(Object), usedBytes: 0 });
      });

      it('should return the uploaded files', () => {
        expect(result).toEqual({
          uploadedFiles: {
            'file1.jpeg': {
              displayName: `file1-${id}.jpeg`,
              parentPath: `media/${docId}`,
              path: `media/${docId}/file1-${id}.jpeg`,
              url: `https://cdn.domain.com/media/${docId}/file1-${id}.jpeg`,
              portableUrl: `cdn://media/${docId}/file1-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              type: 'file',
              size: 3000000
            },
            'file2.jpeg': {
              displayName: `file2-${id}.jpeg`,
              parentPath: `media/${docId}`,
              path: `media/${docId}/file2-${id}.jpeg`,
              url: `https://cdn.domain.com/media/${docId}/file2-${id}.jpeg`,
              portableUrl: `cdn://media/${docId}/file2-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              type: 'file',
              size: 3000000
            }
          },
          usedBytes: expect.any(Number)
        });
      });
    });

    describe('when the storage type is private but the user has no storage plan allocated', () => {
      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg' }
        ];

        await db.users.updateOne(
          { _id: myUser._id },
          { $set: { storage: { planId: null, usedBytes: 0, reminders: [] } } }
        );

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Cannot upload to private storage without a storage plan');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private but the user has not enough storage space left', () => {
      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 5 * 1000 * 1000 },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 5 * 1000 * 1000 }
        ];

        myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        try {
          await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Not enough storage space: available 8 MB, required 10 MB');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private and the user has enough storage space left', () => {
      const id = 'xyz';
      const otherRoomId = uniqueId.create();

      let filesInRoomBeforeUpload;
      let filesInRoomAfterUpload;
      let filesInOtherRoom;

      beforeEach(async () => {
        parentPath = `rooms/${roomId}/media`;
        files = [
          { path: 'path/to/file1.jpeg', originalname: 'file1.jpeg', size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { path: 'path/to/file2.jpeg', originalname: 'file2.jpeg', size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInRoomBeforeUpload = [
          { name: `rooms/${roomId}/media/old-file-1-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `rooms/${roomId}/media/old-file-2-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInRoomAfterUpload = [
          ...filesInRoomBeforeUpload,
          { name: `rooms/${roomId}/media/file1-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' },
          { name: `rooms/${roomId}/media/file2-${id}.jpeg`, size: 3 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }
        ];

        filesInOtherRoom = [{ name: `rooms/${otherRoomId}/media/old-file-3-${id}.png`, size: 1 * 1000 * 1000, lastModified: '2022-06-09T12:00:00.000Z' }];

        const usedBytes = [...filesInRoomBeforeUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { planId: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerId.resolves([roomId, otherRoomId]);
        cdn.listObjects.withArgs({ prefix: `rooms/${roomId}/media/`, recursive: true }).resolves(filesInRoomAfterUpload);
        cdn.listObjects.withArgs({ prefix: `rooms/${otherRoomId}/media/`, recursive: true }).resolves(filesInOtherRoom);
        cdn.listObjects.resolves([]);

        cdn.uploadObject.resolves();

        sandbox.stub(uniqueId, 'create').returns(id);
        result = await sut.uploadFiles({ parentPath, files, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.uploadObject for each file', () => {
        sinon.assert.calledTwice(cdn.uploadObject);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file1-(.+)\.jpeg/), files[0].path);
        sinon.assert.calledWith(cdn.uploadObject, sinon.match(/rooms\/(.+)\/media\/file2-(.+)\.jpeg/), files[1].path);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${roomId}/media/`, recursive: true });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${otherRoomId}/media/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes)
          .toBe([...filesInRoomAfterUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0));
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });

      it('should return the recalculated used bytes', () => {
        expect(result).toEqual({
          uploadedFiles: expect.any(Object),
          usedBytes: [...filesInRoomAfterUpload, ...filesInOtherRoom].reduce((totalSize, file) => totalSize + file.size, 0)
        });
      });

      it('should return the uploaded files', () => {
        expect(result).toEqual({
          uploadedFiles: {
            'file1.jpeg': {
              displayName: `file1-${id}.jpeg`,
              parentPath: `rooms/${roomId}/media`,
              path: `rooms/${roomId}/media/file1-${id}.jpeg`,
              url: `https://cdn.domain.com/rooms/${roomId}/media/file1-${id}.jpeg`,
              portableUrl: `cdn://rooms/${roomId}/media/file1-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              type: 'file',
              size: 3000000
            },
            'file2.jpeg': {
              displayName: `file2-${id}.jpeg`,
              parentPath: `rooms/${roomId}/media`,
              path: `rooms/${roomId}/media/file2-${id}.jpeg`,
              url: `https://cdn.domain.com/rooms/${roomId}/media/file2-${id}.jpeg`,
              portableUrl: `cdn://rooms/${roomId}/media/file2-${id}.jpeg`,
              createdOn: '2022-06-09T12:00:00.000Z',
              type: 'file',
              size: 3000000
            }
          },
          usedBytes: expect.any(Number)
        });
      });
    });
  });

  describe('deleteObject', () => {
    let lock;
    let path;
    let result;

    beforeEach(() => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();
    });

    describe('when the storage type is unknown', () => {
      path = 'other-path/media/file.jpeg';

      beforeEach(async () => {
        try {
          await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
        } catch (error) {
          result = error.message;
        }
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should throw an error', () => {
        expect(result).toBe('Invalid storage path \'other-path/media/\'');
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is public', () => {
      beforeEach(async () => {
        path = 'media/file.jpeg';

        myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        cdn.deleteObjects.resolves();
        roomStore.getRoomIdsByOwnerId.resolves([]);

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should not call roomStore.getRoomIdsByOwnerId', () => {
        sinon.assert.notCalled(roomStore.getRoomIdsByOwnerId);
      });

      it('should not call cdn.listObjects', () => {
        sinon.assert.notCalled(cdn.listObjects);
      });

      it('should not update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(myUser.storage.usedBytes);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });

    describe('when the storage type is private', () => {
      let allOwnedPrivateRoomIds;

      beforeEach(async () => {
        path = `rooms/${roomId}/media/file.jpeg`;

        files = [
          { size: 1 * 1000 * 1000 },
          { size: 1 * 1000 * 1000 },
          { name: `rooms/${roomId}/media/file.jpeg`, size: 1 * 1000 * 1000 }
        ];

        allOwnedPrivateRoomIds = [roomId, uniqueId.create()];

        const usedBytes = files.reduce((totalSize, file) => totalSize + file.size, 0);
        myUser.storage = { planId: storagePlan._id, usedBytes, reminders: [] };
        await db.users.updateOne({ _id: myUser._id }, { $set: { storage: myUser.storage } });

        roomStore.getRoomIdsByOwnerId.resolves(allOwnedPrivateRoomIds);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true }).resolves([files[0]]);
        cdn.listObjects.withArgs({ prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true }).resolves([files[1]]);

        cdn.deleteObjects.resolves();

        await sut.deleteObject({ path, storageClaimingUserId: myUser._id });
      });

      it('should take the lock on the user record', () => {
        sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
      });

      it('should call cdn.deleteObjects', () => {
        sinon.assert.calledWith(cdn.deleteObjects, [path]);
      });

      it('should call cdn.listObjects for each room', () => {
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[0]}/media/`, recursive: true });
        sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${allOwnedPrivateRoomIds[1]}/media/`, recursive: true });
      });

      it('should update the user\'s usedBytes', async () => {
        const updatedUser = await db.users.findOne({ _id: myUser._id });
        expect(updatedUser.storage.usedBytes).toBe(files[0].size + files[1].size);
      });

      it('should release the lock', () => {
        sinon.assert.called(lockStore.releaseLock);
      });
    });
  });

  describe('deleteRoomAndResources', () => {
    let lock;
    let roomDocuments;
    let remainingPrivateRoom;
    let filesFromRemainingPrivateRoom;

    beforeEach(async () => {
      lock = { id: uniqueId.create() };
      lockStore.takeUserLock.resolves(lock);
      lockStore.releaseLock.resolves();

      roomDocuments = [{ _id: uniqueId.create() }, { _id: uniqueId.create() }];
      documentStore.getDocumentsMetadataByRoomId.resolves(roomDocuments);

      documentStore.deleteDocumentsByRoomId.resolves();
      documentRevisionStore.deleteDocumentsByRoomId.resolves();
      roomInvitationStore.deleteRoomInvitationsByRoomId.resolves();
      roomStore.deleteRoomById.resolves();
      commentStore.deleteCommentsByDocumentIds.resolves();

      remainingPrivateRoom = { _id: uniqueId.create() };

      const filesFromRoomBeingDeleted = [
        { name: `rooms/${roomId}/media/file1`, size: 1 * 1000 * 1000 },
        { name: `rooms/${roomId}/media/file2`, size: 2 * 1000 * 1000 }
      ];

      filesFromRemainingPrivateRoom = [{ name: `rooms/${remainingPrivateRoom._id}/media/filex`, size: 3 * 1000 * 1000 }];

      cdn.listObjects.resolves([]);
      cdn.listObjects.withArgs({ prefix: `rooms/${roomId}/media/`, recursive: true }).resolves(filesFromRoomBeingDeleted);
      cdn.deleteObjects.resolves();
      roomStore.getRoomIdsByOwnerId.resolves([remainingPrivateRoom._id]);
      cdn.listObjects.withArgs({ prefix: `rooms/${remainingPrivateRoom._id}/media/`, recursive: true }).resolves(filesFromRemainingPrivateRoom);

      await sut.deleteRoomAndResources({ roomId, roomOwnerId: myUser._id });
    });

    it('should take the lock on the user record', () => {
      sinon.assert.calledWith(lockStore.takeUserLock, myUser._id);
    });

    it('should call documentStore.getDocumentsMetadataByRoomId', () => {
      sinon.assert.calledWith(documentStore.getDocumentsMetadataByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call commentStore.deleteCommentsByDocumentIds', () => {
      sinon.assert.calledWith(commentStore.deleteCommentsByDocumentIds, roomDocuments.map(d => d._id), { session: sinon.match.object });
    });

    it('should call documentStore.deleteDocumentsByRoomId', () => {
      sinon.assert.calledWith(documentStore.deleteDocumentsByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call documentRevisionStore.deleteDocumentsByRoomId', () => {
      sinon.assert.calledWith(documentRevisionStore.deleteDocumentsByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call roomInvitationStore.deleteRoomInvitationsByRoomId', () => {
      sinon.assert.calledWith(roomInvitationStore.deleteRoomInvitationsByRoomId, roomId, { session: sinon.match.object });
    });

    it('should call roomStore.deleteRoomById', () => {
      sinon.assert.calledWith(roomStore.deleteRoomById, roomId, { session: sinon.match.object });
    });

    it('should call cdn.listObjects for the room being deleted', () => {
      sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${roomId}/media/`, recursive: true });
    });

    it('should call cdn.deleteObjects', () => {
      sinon.assert.calledWith(cdn.deleteObjects, [`rooms/${roomId}/media/file1`, `rooms/${roomId}/media/file2`]);
    });

    it('should call roomStore.getRoomIdsByOwnerId', () => {
      sinon.assert.calledWith(roomStore.getRoomIdsByOwnerId, { ownerId: myUser._id });
    });

    it('should call cdn.listObjects for the remaining private room', () => {
      sinon.assert.calledWith(cdn.listObjects, { prefix: `rooms/${remainingPrivateRoom._id}/media/`, recursive: true });
    });

    it('should update the user\'s usedBytes', async () => {
      const updatedUser = await db.users.findOne({ _id: myUser._id });
      expect(updatedUser.storage.usedBytes).toBe(filesFromRemainingPrivateRoom[0].size);
    });

    it('should release the lock', () => {
      sinon.assert.called(lockStore.releaseLock);
    });
  });

  describe('getStorageLocations', () => {
    let result;

    describe('when user is not provided', () => {
      beforeEach(async () => {
        documentStore.getDocumentById.resolves({});
        result = await sut.getStorageLocations({ documentId: 'documentId' });
      });
      it('should return empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when documentId is provided', () => {
      describe(`and the user has ${ROLE.user} role`, () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({});
          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the public storage location with deletion disabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe(`and the user has ${ROLE.admin} role`, () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({});
          const myAdminUser = await setupTestUser(container, { roles: [ROLE.admin] });
          result = await sut.getStorageLocations({ user: myAdminUser, documentId: 'documentId' });
        });

        it('should return the public storage location with deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

    describe('when documentId of a document in a room is provided', () => {
      describe('and the user is room owner and does not have a storage plan', () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { planId: null, usedBytes: 0, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the public storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room owner and has a storage plan', () => {
        beforeEach(async () => {
          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({ _id: 'room', owner: myUser._id, documentsMode: ROOM_DOCUMENTS_MODE.exclusive, members: [] });

          myUser.storage = { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] };

          result = await sut.getStorageLocations({ user: myUser, documentId: 'documentId' });
        });

        it('should return the public and private storage locations, with private storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.private,
              usedBytes: myUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              rootPath: 'rooms/room/media',
              homePath: 'rooms/room/media',
              isDeletionEnabled: true
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner does not have a storage plan', () => {
        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            email: 'collaborator@test.com',
            displayName: 'collaborator'
          });
          const ownerUser = await setupTestUser(container, {
            email: 'owner@test.com',
            displayName: 'Owner'
          });

          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, documentId: 'documentId' });
        });

        it('should return the public storage location', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: false
            }
          ]);
        });
      });

      describe('and the user is room collaborator and the room owner has a storage plan', () => {
        let ownerUser;

        beforeEach(async () => {
          const collaboratorUser = await setupTestUser(container, {
            email: 'collaborator@test.com',
            displayName: 'Collaborator'
          });
          ownerUser = await setupTestUser(container, {
            email: 'owner@test.com',
            displayName: 'Owner',
            storage: { planId: storagePlan._id, usedBytes: 2 * 1000 * 1000, reminders: [] }
          });

          documentStore.getDocumentById.resolves({ roomId: 'room' });
          roomStore.getRoomById.resolves({
            _id: 'room',
            owner: ownerUser._id,
            documentsMode: ROOM_DOCUMENTS_MODE.collaborative,
            members: [{ userId: collaboratorUser._id }]
          });

          result = await sut.getStorageLocations({ user: collaboratorUser, documentId: 'documentId' });
        });

        it('should return the public and private storage locations, with private storage deletion enabled', () => {
          expect(result).toEqual([
            {
              type: STORAGE_LOCATION_TYPE.public,
              rootPath: 'media',
              homePath: 'media/documentId',
              isDeletionEnabled: false
            },
            {
              type: STORAGE_LOCATION_TYPE.private,
              usedBytes: ownerUser.storage.usedBytes,
              maxBytes: storagePlan.maxBytes,
              rootPath: 'rooms/room/media',
              homePath: 'rooms/room/media',
              isDeletionEnabled: true
            }
          ]);
        });
      });
    });

  });

});
