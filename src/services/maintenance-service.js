import Logger from '../common/logger.js';
import Database from '../stores/database.js';
import { delay } from '../utils/time-utils.js';
import MaintenanceLockStore from '../stores/maintenance-lock-store.js';

const MONGO_DUPLUCATE_KEY_ERROR_CODE = 11000;

const logger = new Logger(import.meta.url);

export default class MaintenanceService {
  static get inject() { return [Database, MaintenanceLockStore]; }

  constructor(database, maintenanceLockStore) {
    this.database = database;
    this.maintenanceLockStore = maintenanceLockStore;
  }

  async runMaintenance() {
    // eslint-disable-next-line no-await-in-loop
    while (await this.database.hasPendingMigrationScripts()) {
      let lock;
      try {
        // eslint-disable-next-line no-await-in-loop
        lock = await this.maintenanceLockStore.takeLock(MaintenanceService.MAINTENANCE_LOCK_KEY);
        // eslint-disable-next-line no-await-in-loop
        await this.database.runMigrationScripts();
        logger.info('Migration scripts have run successfully');
      } catch (error) {
        if (error.code === MONGO_DUPLUCATE_KEY_ERROR_CODE) {
          logger.info(`Lock is already taken, waiting for ${MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC} sec.`);
          // eslint-disable-next-line no-await-in-loop
          await delay(MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC * 1000);
        } else {
          throw error;
        }
      } finally {
        if (lock) {
          // eslint-disable-next-line no-await-in-loop
          await this.maintenanceLockStore.releaseLock(lock);
        }
      }
    }
  }
}

MaintenanceService.MAINTENANCE_LOCK_KEY = 'MAINTENANCE';
MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC = 10;
