import sinon from 'sinon';
import MaintenanceService from './maintenance-service.js';

describe('maintenance-service', () => {
  const sandbox = sinon.createSandbox();

  let sut;
  let database;
  let maintenanceLockStore;

  beforeAll(() => {
    database = {
      hasPendingMigrationScripts: () => Promise.reject(new Error('not stubbed')),
      runMigrationScripts: () => Promise.reject(new Error('not stubbed'))
    };
    maintenanceLockStore = {
      takeLock: () => Promise.reject(new Error('not stubbed')),
      releaseLock: () => Promise.reject(new Error('not stubbed'))
    };
    sut = new MaintenanceService(database, maintenanceLockStore);
  });

  beforeEach(() => {
    sandbox.stub(database, 'hasPendingMigrationScripts');
    sandbox.stub(database, 'runMigrationScripts');
    sandbox.stub(maintenanceLockStore, 'takeLock');
    sandbox.stub(maintenanceLockStore, 'releaseLock');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('runMaintenance', () => {
    beforeEach(() => {
      database.runMigrationScripts.resolves();
    });

    describe('when there are no pending migration scripts', () => {
      beforeEach(async () => {
        database.hasPendingMigrationScripts.resolves(false);
        maintenanceLockStore.takeLock.resolves({});
        await sut.runMaintenance();
      });

      it('should not have taken the lock', () => {
        sinon.assert.notCalled(maintenanceLockStore.takeLock);
      });

      it('should not have run the migrations', () => {
        sinon.assert.notCalled(database.runMigrationScripts);
      });
    });

    describe('when there are pending migration scripts', () => {
      beforeEach(() => {
        database.hasPendingMigrationScripts
          .onFirstCall().resolves(true)
          .onSecondCall().resolves(false);
      });

      describe('and no lock is taken', () => {
        beforeEach(async () => {
          maintenanceLockStore.takeLock.resolves({});
          await sut.runMaintenance();
        });

        it('should have taken the lock', () => {
          sinon.assert.calledOnce(maintenanceLockStore.takeLock);
        });

        it('should have released the lock', () => {
          sinon.assert.calledOnce(maintenanceLockStore.releaseLock);
        });

        it('should have run the migrations', () => {
          sinon.assert.calledOnce(database.runMigrationScripts);
        });
      });

      describe('but the lock is already taken', () => {
        beforeEach(async () => {
          sandbox.stub(MaintenanceService, 'MAINTENANCE_LOCK_INTERVAL_IN_SEC').value(0);
          maintenanceLockStore.takeLock
            .onFirstCall().rejects({ code: 11000 })
            .onSecondCall().resolves({});

          await sut.runMaintenance();
        });

        it('should have checked for pending migrations twice', () => {
          sinon.assert.calledTwice(database.hasPendingMigrationScripts);
        });

        it('should not have run the migrations', () => {
          sinon.assert.notCalled(database.runMigrationScripts);
        });
      });

    });

  });

});
