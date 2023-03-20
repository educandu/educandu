import { assert, createSandbox } from 'sinon';
import MaintenanceService from './maintenance-service.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('maintenance-service', () => {
  const sandbox = createSandbox();

  let sut;
  let cdn;
  let database;
  let lockStore;

  beforeAll(() => {
    cdn = {
      ensureDirectory: () => Promise.reject(new Error('not stubbed'))
    };
    database = {
      runMigrationScripts: () => Promise.reject(new Error('not stubbed')),
      checkDb: () => Promise.reject(new Error('not stubbed'))
    };
    lockStore = {
      takeMaintenanceLock: () => Promise.reject(new Error('not stubbed')),
      releaseLock: () => Promise.reject(new Error('not stubbed'))
    };
    sut = new MaintenanceService(cdn, database, lockStore);
  });

  beforeEach(() => {
    sandbox.stub(cdn, 'ensureDirectory');
    sandbox.stub(database, 'runMigrationScripts');
    sandbox.stub(database, 'checkDb');
    sandbox.stub(lockStore, 'takeMaintenanceLock');
    sandbox.stub(lockStore, 'releaseLock');
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
        cdn.ensureDirectory.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock', () => {
        assert.calledOnce(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock', () => {
        assert.calledOnce(lockStore.releaseLock);
      });

      it('should have run the migrations', () => {
        assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks', () => {
        assert.calledOnce(database.checkDb);
      });

      it('should have created the initial CDN directories', () => {
        assert.calledTwice(cdn.ensureDirectory);
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
        cdn.ensureDirectory.resolves();

        await sut.runMaintenance();
      });

      it('should have tried to take the lock twice', () => {
        assert.calledTwice(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock once', () => {
        assert.calledOnce(lockStore.releaseLock);
      });

      it('should have run the migrations once', () => {
        assert.calledOnce(database.runMigrationScripts);
      });

      it('should have run the checks once', () => {
        assert.calledOnce(database.checkDb);
      });
    });

    describe('when an error occurs during migrations', () => {
      let caughtError;

      beforeEach(async () => {
        lockStore.takeMaintenanceLock.resolves({});
        lockStore.releaseLock.resolves({});
        database.runMigrationScripts.rejects(new Error('Migration failed'));
        database.checkDb.resolves();
        cdn.ensureDirectory.resolves();

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
        assert.calledOnce(lockStore.takeMaintenanceLock);
      });

      it('should have released the lock', () => {
        assert.calledOnce(lockStore.releaseLock);
      });

      it('should have tried run the migrations', () => {
        assert.calledOnce(database.runMigrationScripts);
      });

      it('should not have run the checks', () => {
        assert.notCalled(database.checkDb);
      });

      it('should not have created the initial CDN directories', () => {
        assert.notCalled(cdn.ensureDirectory);
      });
    });

  });

});
