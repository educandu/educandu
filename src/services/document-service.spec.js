const testHelper = require('../test-helper');
const DocumentService = require('./document-service');
const DocumentSnapshotStore = require('../stores/document-snapshot-store');
const DocumentOrderStore = require('../stores/document-order-store');
const SectionOrderStore = require('../stores/section-order-store');
const DocumentLockStore = require('../stores/document-lock-store');
const DocumentStore = require('../stores/document-store');
const SectionStore = require('../stores/section-store');
const uniqueId = require('../utils/unique-id');
const dateTime = require('../utils/date-time');
const sinon = require('sinon');

describe('document-service', () => {
  const sandbox = sinon.createSandbox();
  let db;
  let sut;
  let documentSnapshotStore;
  let documentOrderStore;
  let sectionOrderStore;
  let documentLockStore;
  let documentStore;
  let sectionStore;

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
    sectionOrderStore = new SectionOrderStore(db);
    documentLockStore = new DocumentLockStore(db);
    documentStore = new DocumentStore(db);
    sectionStore = new SectionStore(db);

    sandbox.spy(documentStore, 'find');
    sandbox.spy(documentStore, 'findOne');
    sandbox.spy(documentStore, 'save');
    sandbox.spy(documentSnapshotStore, 'save');
    sandbox.spy(documentOrderStore, 'getNextOrder');
    sandbox.spy(documentLockStore, 'takeLock');
    sandbox.spy(documentLockStore, 'releaseLock');

    sut = new DocumentService(
      documentSnapshotStore,
      documentOrderStore,
      sectionOrderStore,
      documentLockStore,
      documentStore,
      sectionStore
    );
  });

  afterEach(async () => {
    await testHelper.dropAllCollections(db);
    sandbox.restore();
  });

  describe('getLastUpdatedDocuments', () => {
    let actualResult;

    beforeEach(async () => {
      actualResult = await sut.getLastUpdatedDocuments(3);
    });

    it('should query the db in descending order', () => {
      sinon.assert.calledOnce(documentStore.find);
      sinon.assert.calledWith(documentStore.find, { sort: [['updatedOn', -1]], limit: 3 });
    });

    it('should return an empty array for the empty database', () => {
      expect(actualResult).toEqual([]);
    });
  });

  describe('getDocumentById', () => {
    let actualResult;

    beforeEach(async () => {
      actualResult = await sut.getDocumentById('abc');
    });

    it('should query the db by id', () => {
      sinon.assert.calledOnce(documentStore.findOne);
      sinon.assert.calledWith(documentStore.findOne, { query: { _id: 'abc' } });
    });

    it('should return null if not found', () => {
      expect(actualResult).toBeNull();
    });
  });

  describe('createDocumentRevision', () => {

    describe('when called without an existing document', () => {
      let actualResult;
      let testDateNow;
      let testSnapshotId;
      let expectedSnapshot;
      let expectedLatestDocument;
      let testDocKey;
      let testTitle;
      let testUser;

      beforeEach(async () => {
        testDocKey = 'Syvf4ZK6z';
        testTitle = 'This is a test title';
        testUser = { name: 'test-user' };
        testDateNow = new Date('2018-05-03T18:35:32.000Z');
        testSnapshotId = 'Hyfb4tZKTf';

        sandbox.stub(dateTime, 'now').returns(testDateNow);
        sandbox.stub(uniqueId, 'create')
          .onCall(0).returns(testDocKey)
          .onCall(1).returns(testSnapshotId)
          .throws('More calls than expected');

        actualResult = await sut.createDocumentRevision({
          doc: {
            title: testTitle
          },
          sections: [],
          user: testUser
        });

        expectedSnapshot = {
          _id: testSnapshotId,
          key: testDocKey,
          createdOn: testDateNow,
          order: 1,
          user: testUser,
          title: testTitle,
          sections: []
        };

        expectedLatestDocument = {
          _id: testDocKey,
          snapshotId: testSnapshotId,
          createdOn: testDateNow,
          updatedOn: testDateNow,
          order: 1,
          user: testUser,
          title: testTitle,
          sections: []
        };
      });

      it('should take the document lock', () => {
        sinon.assert.calledOnce(documentLockStore.takeLock);
        sinon.assert.calledWith(documentLockStore.takeLock, testDocKey);
      });

      it('should release the document lock', () => {
        sinon.assert.calledOnce(documentLockStore.releaseLock);
        sinon.assert.calledWith(documentLockStore.releaseLock, testDocKey);
      });

      it('should get the next document order', () => {
        sinon.assert.calledOnce(documentOrderStore.getNextOrder);
      });

      it('should save the document snapshot', () => {
        sinon.assert.calledOnce(documentSnapshotStore.save);
        sinon.assert.calledWith(documentSnapshotStore.save, expectedSnapshot);
      });

      it('should save the latest document', () => {
        sinon.assert.calledOnce(documentStore.save);
        sinon.assert.calledWith(documentStore.save, expectedLatestDocument);
      });

      it('should return the latest document', () => {
        expect(actualResult).toEqual(expectedLatestDocument);
      });
    });

  });

});
