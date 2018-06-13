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
    sandbox.restore();
  });

  beforeEach(() => {
    documentSnapshotStore = new DocumentSnapshotStore(db);
    documentOrderStore = new DocumentOrderStore(db);
    sectionOrderStore = new SectionOrderStore(db);
    documentLockStore = new DocumentLockStore(db);
    documentStore = new DocumentStore(db);
    sectionStore = new SectionStore(db);

    sandbox.spy(documentSnapshotStore, 'findOne');
    sandbox.spy(documentSnapshotStore, 'save');
    sandbox.spy(documentOrderStore, 'getNextOrder');
    sandbox.spy(sectionOrderStore, 'getNextOrder');
    sandbox.spy(documentLockStore, 'takeLock');
    sandbox.spy(documentLockStore, 'releaseLock');
    sandbox.spy(documentStore, 'find');
    sandbox.spy(documentStore, 'findOne');
    sandbox.spy(documentStore, 'save');
    sandbox.spy(sectionStore, 'findOne');
    sandbox.spy(sectionStore, 'save');

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

  describe('getSectionById', () => {
    let actualResult;

    beforeEach(async () => {
      actualResult = await sut.getSectionById('abc');
    });

    it('should query the db by id', () => {
      sinon.assert.calledOnce(sectionStore.findOne);
      sinon.assert.calledWith(sectionStore.findOne, { query: { _id: 'abc' } });
    });

    it('should return null if not found', () => {
      expect(actualResult).toBeNull();
    });
  });

  describe('getInitialDocumentSnapshot', () => {
    let actualResult;

    beforeEach(async () => {
      actualResult = await sut.getInitialDocumentSnapshot('abc');
    });

    it('should query the db by key', () => {
      sinon.assert.calledOnce(documentSnapshotStore.findOne);
      sinon.assert.calledWith(documentSnapshotStore.findOne, { query: { key: 'abc' }, sort: [['order', 1]] });
    });

    it('should return null if not found', () => {
      expect(actualResult).toBeNull();
    });
  });

  describe('createDocumentRevision', () => {

    describe('when called without an existing document', () => {
      let testUser;
      let testTitle;
      let testDateNow;
      let testSectionId;
      let testSnapshotId;
      let testSectionKey;
      let testDocumentKey;
      let testSectionContent;
      let actualResult;
      let expectedSnapshot;
      let expectedLatestDocument;
      let expectedSectionRevision;

      beforeEach(async () => {
        testDocumentKey = 'Syvf4ZK6z';
        testSectionKey = 'Skmu4u6TaM';
        testSectionId = 'rkGdNdTaaM';
        testTitle = 'This is a test title';
        testUser = { name: 'test-user' };
        testDateNow = new Date('2018-05-03T18:35:32.000Z');
        testSnapshotId = 'Hyfb4tZKTf';
        testSectionContent = { de: '# Hello World!' };

        sandbox.stub(dateTime, 'now').returns(testDateNow);

        sandbox.stub(uniqueId, 'create')
          .onCall(0).returns(testDocumentKey)
          .onCall(1).returns(testSectionId)
          .onCall(2).returns(testSectionKey)
          .onCall(3).returns(testSnapshotId)
          .throws('More calls than expected to uniqueId.create');

        actualResult = await sut.createDocumentRevision({
          doc: {
            title: testTitle
          },
          sections: [
            {
              type: 'markdown',
              updatedContent: testSectionContent
            }
          ],
          user: testUser
        });

        expectedSectionRevision = {
          _id: testSectionId,
          key: testSectionKey,
          createdOn: testDateNow,
          order: 1,
          user: testUser,
          type: 'markdown',
          content: testSectionContent
        };

        expectedSnapshot = {
          _id: testSnapshotId,
          key: testDocumentKey,
          createdOn: testDateNow,
          order: 1,
          user: testUser,
          title: testTitle,
          sections: [{ id: testSectionId }]
        };

        expectedLatestDocument = {
          _id: testDocumentKey,
          snapshotId: testSnapshotId,
          createdOn: testDateNow,
          updatedOn: testDateNow,
          order: 1,
          user: testUser,
          title: testTitle,
          sections: [
            {
              _id: testSectionId,
              key: testSectionKey,
              createdOn: testDateNow,
              order: 1,
              user: testUser,
              type: 'markdown',
              content: testSectionContent
            }
          ]
        };
      });

      it('should take the document lock', () => {
        sinon.assert.calledOnce(documentLockStore.takeLock);
        sinon.assert.calledWith(documentLockStore.takeLock, testDocumentKey);
      });

      it('should release the document lock', () => {
        sinon.assert.calledOnce(documentLockStore.releaseLock);
        sinon.assert.calledWith(documentLockStore.releaseLock, testDocumentKey);
      });

      it('should get the next section order', () => {
        sinon.assert.calledOnce(sectionOrderStore.getNextOrder);
      });

      it('should get the next document order', () => {
        sinon.assert.calledOnce(documentOrderStore.getNextOrder);
      });

      it('should save the section revision', () => {
        sinon.assert.calledOnce(sectionStore.save);
        sinon.assert.calledWith(sectionStore.save, expectedSectionRevision);
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

    /* eslint max-lines: 0 */
    /* eslint no-unused-vars: 0 */
    /* eslint capitalized-comments: 0 */
    xdescribe('when called with an existing document', () => {
      let testUser;
      let testTitle;
      let initialDateNow;
      let updateDateNow;
      let initialSectionId;
      let updatedSectionId;
      let additionalSectionId;
      let initialSnapshotId;
      let updatedSnapshotId;
      let initialSectionKey;
      let additionalSectionKey;
      let testDocumentKey;
      let initialTestSectionContent;
      let updatedTestSectionContent;
      let additionalTestSectionContent;
      let actualResult;
      let expectedSnapshot;
      let expectedLatestDocument;
      let expectedSectionRevision;

      beforeEach(async () => {
        testDocumentKey = 'Syvf4ZK6z';
        initialSectionKey = 'Skmu4u6TaM';
        additionalSectionKey = 'SyMXOa6aM';
        initialSectionId = 'rkGdNdTaaM';
        updatedSectionId = 'Sye$V$ppTz';
        additionalSectionId = 'B1Ek$Wy1m';
        testTitle = 'This is a test title';
        testUser = { name: 'test-user' };
        initialDateNow = new Date('2018-05-03T18:35:32.000Z');
        updateDateNow = new Date('2018-05-03T18:35:32.000Z');
        initialSnapshotId = 'Hyfb4tZKTf';
        updatedSnapshotId = 'HybdE$6pTf';
        initialTestSectionContent = { de: '# Hello World!' };
        updatedTestSectionContent = { de: '# UPDATED!' };
        additionalTestSectionContent = { de: '# Additional' };

        sandbox.stub(dateTime, 'now')
          .onCall(0).returns(initialDateNow)
          .onCall(1).returns(updateDateNow)
          .throws('More calls than expected to dateTime.now');

        sandbox.stub(uniqueId, 'create')
          .onCall(0).returns(testDocumentKey)
          .onCall(1).returns(initialSectionId)
          .onCall(2).returns(initialSectionKey)
          .onCall(3).returns(initialSnapshotId)
          .onCall(4).returns(updatedSectionId)
          .onCall(5).returns(additionalSectionId)
          .onCall(6).returns(additionalSectionKey)
          .onCall(7).returns(updatedSnapshotId)
          .onCall(8).returns('75vn94z5n')
          .throws('More calls than expected to uniqueId.create');

        // Create initial document with one section:
        await sut.createDocumentRevision({
          doc: {
            title: testTitle
          },
          sections: [
            {
              type: 'markdown',
              updatedContent: initialTestSectionContent
            }
          ],
          user: testUser
        });

        actualResult = await sut.createDocumentRevision({
          doc: {
            key: testDocumentKey,
            title: testTitle
          },
          sections: [
            {
              _id: initialSectionId,
              updatedContent: updatedTestSectionContent
            },
            {
              type: 'markdown',
              updatedContent: additionalTestSectionContent
            }
          ],
          user: testUser
        });

        // expectedSectionRevision = {
        //   _id: initialSectionId,
        //   key: testSectionKey,
        //   createdOn: testDateNow,
        //   order: 1,
        //   user: testUser,
        //   type: 'markdown',
        //   content: updatedTestSectionContent
        // };

        // expectedSnapshot = {
        //   _id: testSnapshotId,
        //   key: testDocumentKey,
        //   createdOn: testDateNow,
        //   order: 1,
        //   user: testUser,
        //   title: testTitle,
        //   sections: [{ id: initialSectionId }]
        // };

        expectedLatestDocument = {
          _id: testDocumentKey,
          snapshotId: updatedSnapshotId,
          createdOn: initialDateNow,
          updatedOn: updateDateNow,
          order: 2,
          user: testUser,
          title: testTitle,
          sections: [
            {
              _id: initialSectionId,
              key: initialSectionKey,
              createdOn: updateDateNow,
              order: 2,
              user: testUser,
              type: 'markdown',
              content: updatedTestSectionContent
            },
            {
              _id: additionalSectionId,
              key: additionalSectionKey,
              createdOn: updateDateNow,
              order: 1,
              user: testUser,
              type: 'markdown',
              content: additionalTestSectionContent
            }
          ]
        };
      });

      it('should take the document lock for each invocation', () => {
        sinon.assert.calledTwice(documentLockStore.takeLock);
        sinon.assert.calledWith(documentLockStore.takeLock, testDocumentKey);
      });

      it('should release the document lock for each invocation', () => {
        sinon.assert.calledTwice(documentLockStore.releaseLock);
        sinon.assert.calledWith(documentLockStore.releaseLock, testDocumentKey);
      });

      it('should get the next section order for each revision', () => {
        sinon.assert.calledThrice(sectionOrderStore.getNextOrder);
      });

      it('should get the next document order for each snapshot', () => {
        sinon.assert.calledTwice(documentOrderStore.getNextOrder);
      });

      // it('should save the section revision', () => {
      //   sinon.assert.calledOnce(sectionStore.save);
      //   sinon.assert.calledWith(sectionStore.save, expectedSectionRevision);
      // });

      // it('should save the document snapshot', () => {
      //   sinon.assert.calledOnce(documentSnapshotStore.save);
      //   sinon.assert.calledWith(documentSnapshotStore.save, expectedSnapshot);
      // });

      // it('should save the latest document', () => {
      //   sinon.assert.calledOnce(documentStore.save);
      //   sinon.assert.calledWith(documentStore.save, expectedLatestDocument);
      // });

      it('should return the latest document', () => {
        expect(actualResult).toEqual(expectedLatestDocument);
      });
    });

  });

});
