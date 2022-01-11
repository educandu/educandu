import sinon from 'sinon';
import MaintenanceService from './maintenance-service.js';

describe('maintenance-service', () => {
  const sandbox = sinon.createSandbox();

  let sut;
  let database;
  let maintenanceLockStore;

  beforeAll(() => {
    database = {
      runMigrationScripts: () => Promise.reject(new Error('not stubbed')),
      checkDb: () => Promise.reject(new Error('not stubbed'))
    };
    maintenanceLockStore = {
      takeLock: () => Promise.reject(new Error('not stubbed')),
      releaseLock: () => Promise.reject(new Error('not stubbed'))
    };
    sut = new MaintenanceService(database, maintenanceLockStore);
  });

  beforeEach(() => {
    sandbox.stub(database, 'runMigrationScripts');
    sandbox.stub(database, 'checkDb');
    sandbox.stub(maintenanceLockStore, 'takeLock');
    sandbox.stub(maintenanceLockStore, 'releaseLock');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('runMaintenance', () => {

    describe('when no lock is taken', () => {
      beforeEach(async () => {
        maintenanceLockStore.takeLock.resolves({});
        maintenanceLockStore.releaseLock.resolves({});
        database.runMigrationScripts.resolves();
        database.checkDb.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock', () => {
        sinon.assert.calledOnce(maintenanceLockStore.takeLock);
      });

      it('should have released the lock', () => {
        sinon.assert.calledOnce(maintenanceLockStore.releaseLock);
      });

      it('should have run the migrations', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks', () => {
        sinon.assert.calledOnce(database.checkDb);
      });
    });

    describe('when the lock is already taken on first try', () => {
      beforeEach(async () => {
        sandbox.stub(MaintenanceService, 'MAINTENANCE_LOCK_INTERVAL_IN_SEC').value(0);
        maintenanceLockStore.takeLock
          .onFirstCall().rejects({ code: 11000 })
          .onSecondCall().resolves({});

        maintenanceLockStore.releaseLock.resolves({});
        database.runMigrationScripts.resolves();
        database.checkDb.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock twice', () => {
        sinon.assert.calledTwice(maintenanceLockStore.takeLock);
      });

      it('should have released the lock once', () => {
        sinon.assert.calledOnce(maintenanceLockStore.releaseLock);
      });

      it('should have run the migrations once', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks once', () => {
        sinon.assert.calledOnce(database.checkDb);
      });
    });

    describe('when an error occurs during migrations', () => {
      let caughtError;

      beforeEach(async () => {
        maintenanceLockStore.takeLock.resolves({});
        maintenanceLockStore.releaseLock.resolves({});
        database.runMigrationScripts.rejects(new Error('Migration failed'));
        database.checkDb.resolves();

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
        sinon.assert.calledOnce(maintenanceLockStore.takeLock);
      });

      it('should have released the lock', () => {
        sinon.assert.calledOnce(maintenanceLockStore.releaseLock);
      });

      it('should have tried run the migrations', () => {
        sinon.assert.calledOnce(database.runMigrationScripts);
      });

      it('should not have run the checks', () => {
        sinon.assert.notCalled(database.checkDb);
      });
    });

  });

});
