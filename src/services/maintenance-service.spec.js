import sinon from 'sinon';
import MaintenanceService from './maintenance-service.js';

describe('maintenance-service', () => {
  const sandbox = sinon.createSandbox();

  let sut;
  let cdn;
  let database;
  let lockStore;
  let lessonConvertor;

  beforeAll(() => {
    cdn = {
      uploadEmptyObject: () => Promise.reject(new Error('not stubbed'))
    };
    database = {
      runMigrationScripts: () => Promise.reject(new Error('not stubbed')),
      checkDb: () => Promise.reject(new Error('not stubbed'))
    };
    lockStore = {
      takeMaintenanceLock: () => Promise.reject(new Error('not stubbed')),
      releaseLock: () => Promise.reject(new Error('not stubbed'))
    };
    lessonConvertor = {
      convertAllLessonsToDocuments: () => Promise.reject(new Error('not stubbed'))
    };
    sut = new MaintenanceService(cdn, database, lessonConvertor, lockStore);
  });

  beforeEach(() => {
    sandbox.stub(cdn, 'uploadEmptyObject');
    sandbox.stub(database, 'runMigrationScripts');
    sandbox.stub(database, 'checkDb');
    sandbox.stub(lockStore, 'takeMaintenanceLock');
    sandbox.stub(lockStore, 'releaseLock');
    sandbox.stub(lessonConvertor, 'convertAllLessonsToDocuments');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('runMaintenance', () => {

    describe('when no lock is taken', () => {
      beforeEach(async () => {
        lockStore.takeMaintenanceLock.resolves({});
        lockStore.releaseLock.resolves({});
        database.runMigrationScripts.resolves();
        database.checkDb.resolves();
        cdn.uploadEmptyObject.resolves();
        lessonConvertor.convertAllLessonsToDocuments.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock', () => {
        sinon.assert.calledOnce(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock', () => {
        sinon.assert.calledOnce(lockStore.releaseLock);
      });

      it('should have run the migrations', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks', () => {
        sinon.assert.calledOnce(database.checkDb);
      });

      it('should have run the lessons conversion', () => {
        sinon.assert.calledOnce(lessonConvertor.convertAllLessonsToDocuments);
      });

      it('should have created the initial CDN directories', () => {
        sinon.assert.calledTwice(cdn.uploadEmptyObject);
      });
    });

    describe('when the lock is already taken on first try', () => {
      beforeEach(async () => {
        sandbox.stub(MaintenanceService, 'MAINTENANCE_LOCK_INTERVAL_IN_SEC').value(0);
        lockStore.takeMaintenanceLock
          .onFirstCall().rejects({ code: 11000 })
          .onSecondCall().resolves({});

        lockStore.releaseLock.resolves({});
        database.runMigrationScripts.resolves();
        database.checkDb.resolves();
        cdn.uploadEmptyObject.resolves();
        lessonConvertor.convertAllLessonsToDocuments.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock twice', () => {
        sinon.assert.calledTwice(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock once', () => {
        sinon.assert.calledOnce(lockStore.releaseLock);
      });

      it('should have run the migrations once', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks once', () => {
        sinon.assert.calledOnce(database.checkDb);
      });

      it('should have run the lessons conversion', () => {
        sinon.assert.calledOnce(lessonConvertor.convertAllLessonsToDocuments);
      });
    });

    describe('when an error occurs during migrations', () => {
      let caughtError;

      beforeEach(async () => {
        lockStore.takeMaintenanceLock.resolves({});
        lockStore.releaseLock.resolves({});
        database.runMigrationScripts.rejects(new Error('Migration failed'));
        database.checkDb.resolves();
        cdn.uploadEmptyObject.resolves();
        lessonConvertor.convertAllLessonsToDocuments.resolves();

        caughtError = null;
        try {
          await sut.runMaintenance();
        } catch (error) {
          caughtError = error;
        }
      });

      it('should have thrown an error', () => {
        expect(caughtError).toBeInstanceOf(Error);
      });

      it('should have tried to take the lock', () => {
        sinon.assert.calledOnce(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock', () => {
        sinon.assert.calledOnce(lockStore.releaseLock);
      });

      it('should have tried run the migrations', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should not have run the checks', () => {
        sinon.assert.notCalled(database.checkDb);
      });

      it('should have not run the lessons conversion', () => {
        sinon.assert.notCalled(lessonConvertor.convertAllLessonsToDocuments);
      });

      it('should not have created the initial CDN directories', () => {
        sinon.assert.notCalled(cdn.uploadEmptyObject);
      });
    });

  });

});
