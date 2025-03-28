import Cdn from '../stores/cdn.js';
import Logger from '../common/logger.js';
import Database from '../stores/database.js';
import { delay } from '../utils/time-utils.js';
import LockStore from '../stores/lock-store.js';
import { getDocumentInputMediaRootPath, getMediaLibraryPath, getMediaTrashPath, getRoomMediaRootPath, getTemporaryUploadsPath } from '../utils/storage-utils.js';

const MONGO_DUPLUCATE_KEY_ERROR_CODE = 11000;

const logger = new Logger(import.meta.url);

export default class MaintenanceService {
  static dependencies = [Cdn, Database, LockStore];

  constructor(cdn, database, lockStore) {
    this.cdn = cdn;
    this.database = database;
    this.lockStore = lockStore;
  }

  async runMaintenance() {
    let lock = null;

    while (!lock) {
      try {
        lock = await this.lockStore.takeMaintenanceLock(MaintenanceService.MAINTENANCE_LOCK_KEY);
      } catch (error) {
        if (error.code === MONGO_DUPLUCATE_KEY_ERROR_CODE) {
          logger.info(`Maintenance lock is already taken, waiting for ${MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC} sec.`);
          await delay(MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC * 1000);
        } else {
          throw error;
        }
      }
    }

    try {
      logger.info('Starting database migrations');
      await this.database.runMigrationScripts();
      logger.info('Finished database migrations successfully');

      logger.info('Starting database checks');
      await this.database.checkDb();
      logger.info('Finished database checks successfully');

      logger.info('Creating basic CDN directories');
      await Promise.all([
        this.cdn.ensureDirectory({ directoryPath: getTemporaryUploadsPath() }),
        this.cdn.ensureDirectory({ directoryPath: getMediaLibraryPath() }),
        this.cdn.ensureDirectory({ directoryPath: getMediaTrashPath() }),
        this.cdn.ensureDirectory({ directoryPath: getRoomMediaRootPath() }),
        this.cdn.ensureDirectory({ directoryPath: getDocumentInputMediaRootPath() })
      ]);
      logger.info('Finished creating basic CDN directories successfully');
    } finally {
      await this.lockStore.releaseLock(lock);
    }
  }
}

MaintenanceService.MAINTENANCE_LOCK_KEY = 'MAINTENANCE';
MaintenanceService.MAINTENANCE_LOCK_INTERVAL_IN_SEC = 5;
