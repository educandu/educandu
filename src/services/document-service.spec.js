const testHelper = require('../test-helper');
const DocumentService = require('./document-service');
const DocumentSnapshotStore = require('../stores/document-snapshot-store');
const DocumentOrderStore = require('../stores/document-order-store');
const DocumentLockStore = require('../stores/document-lock-store');
const DocumentStore = require('../stores/document-store');
const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');
const sinon = require('sinon');

describe('document-service', () => {
  const sandbox = sinon.createSandbox();
  let db;
  let sut;
  let documentSnapshotStore;
  let documentOrderStore;
  let documentLockStore;
  let documentStore;

  beforeAll(async () => {
    db = await testHelper.createTestDatabase();
  });

  afterAll(async () => {
    await testHelper.dropDatabase(db);
    await db.dispose();
  });

  beforeEach(() => {
    documentSnapshotStore = new DocumentSnapshotStore(db);
    documentOrderStore = new DocumentOrderStore(db);
    documentLockStore = new DocumentLockStore(db);
    documentStore = new DocumentStore(db);

    sandbox.spy(documentStore, 'save');
    sandbox.spy(documentSnapshotStore, 'save');
    sandbox.spy(documentSnapshotStore, 'getFirst');
    sandbox.spy(documentOrderStore, 'getNextDocumentOrder');
    sandbox.spy(documentLockStore, 'takeDocumentLock');
    sandbox.spy(documentLockStore, 'releaseDocumentLock');

    sut = new DocumentService(
      documentSnapshotStore,
      documentOrderStore,
      documentLockStore,
      documentStore
    );
  });

  afterEach(async () => {
    await testHelper.dropAllCollections(db);
    sandbox.restore();
  });

  describe('createDocumentRevision', () => {
    let actualResult;
    let testDateNow;
    let testSnapshotId;
    let expectedSnapshot;
    let expectedLatestDocument;
    let testDocumentId;
    let testTitle;
    let testUserName;

    beforeEach(async () => {
      testDocumentId = 'Syvf4ZK6z';
      testTitle = 'This is a test title';
      testUserName = 'test-user';
      testDateNow = new Date('2018-05-03T18:35:32.000Z');
      testSnapshotId = 'Hyfb4tZKTf';

      sandbox.stub(dateTime, 'now').returns(testDateNow);
      sandbox.stub(uniqueId, 'create').returns(testSnapshotId);

      actualResult = await sut.createDocumentRevision({
        documentId: testDocumentId,
        title: testTitle,
        sections: [],
        user: {
          name: testUserName
        }
      });

      expectedSnapshot = {
        _id: testSnapshotId,
        documentId: testDocumentId,
        createdOn: testDateNow,
        order: 1,
        user: {
          name: testUserName
        },
        title: testTitle,
        sections: []
      };

      expectedLatestDocument = {
        _id: testDocumentId,
        snapshotId: testSnapshotId,
        createdOn: testDateNow,
        updatedOn: testDateNow,
        order: 1,
        user: {
          name: testUserName
        },
        title: testTitle,
        sections: []
      };
    });

    it('should take the document lock', () => {
      sinon.assert.calledOnce(documentLockStore.takeDocumentLock);
      sinon.assert.calledWith(documentLockStore.takeDocumentLock, testDocumentId);
    });

    it('should release the document lock', () => {
      sinon.assert.calledOnce(documentLockStore.releaseDocumentLock);
      sinon.assert.calledWith(documentLockStore.releaseDocumentLock, testDocumentId);
    });

    it('should get the next document order', () => {
      sinon.assert.calledOnce(documentOrderStore.getNextDocumentOrder);
    });

    it('should save the document snapshot', () => {
      sinon.assert.calledOnce(documentSnapshotStore.save);
      sinon.assert.calledWith(documentSnapshotStore.save, expectedSnapshot);
    });

    it('should save the latest document', () => {
      sinon.assert.calledOnce(documentStore.save);
      sinon.assert.calledWith(documentStore.save, expectedLatestDocument);
    });

    it('should return the expected result', () => {
      expect(actualResult).toEqual(expectedLatestDocument);
    });
  });

});
