import Cdn from '../repositories/cdn.js';
import Logger from '../common/logger.js';
import Database from '../stores/database.js';
import { delay } from '../utils/time-utils.js';
import LockStore from '../stores/lock-store.js';
import { STORAGE_DIRECTORY_MARKER_NAME } from '../domain/constants.js';
import { getPrivateRoomsRootPath, getPublicRootPath } from '../utils/storage-utils.js';

const MONGO_DUPLUCATE_KEY_ERROR_CODE = 11000;

const logger = new Logger(import.meta.url);

export default class MaintenanceService {
  static get inject() { return [Cdn, Database, LockStore]; }

  constructor(cdn, database, lockStore) {
    this.cdn = cdn;
    this.database = database;
    this.lockStore = lockStore;
  }

  async runMaintenance() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let lock;
      try {
        // eslint-disable-next-line no-await-in-loop
        lock = await this.lockStore.takeMaintenanceLock(MaintenanceService.MAINTENANCE_LOCK_KEY);

        logger.info('Starting database migrations');
        // eslint-disable-next-line no-await-in-loop
        await this.database.runMigrationScripts();
        logger.info('Finished database migrations successfully');

        logger.info('Starting database checks');
        // eslint-disable-next-line no-await-in-loop
        await this.database.checkDb();
        logger.info('Finished database checks successfully');

        logger.info('Creating basic CDN directories');
        // eslint-disable-next-line no-await-in-loop
        await this.cdn.uploadEmptyObject(`${getPublicRootPath()}/${STORAGE_DIRECTORY_MARKER_NAME}`);
        // eslint-disable-next-line no-await-in-loop
        await this.cdn.uploadEmptyObject(`${getPrivateRoomsRootPath()}/${STORAGE_DIRECTORY_MARKER_NAME}`);
        logger.info('Finished creating basic CDN directories successfully');

        return;
      } catch (error) {
        if (error.code === MONGO_DUPLUCATE_KEY_ERROR_CODE) {
          logger.info(`Maintenance lock is already taken, waiting for ${MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC} sec.`);
          // eslint-disable-next-line no-await-in-loop
          await delay(MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC * 1000);
        } else {
          throw error;
        }
      } finally {
        if (lock) {
          // eslint-disable-next-line no-await-in-loop
          await this.lockStore.releaseLock(lock);
        }
      }
    }
  }
}

MaintenanceService.MAINTENANCE_LOCK_KEY = 'MAINTENANCE';
MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC = 5;
