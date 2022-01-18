import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_EXPIRATION_TIME_IN_MINUTES = 10;

class TaskLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.taskLocks, LOCK_EXPIRATION_TIME_IN_MINUTES);
  }
}

export default TaskLockStore;
