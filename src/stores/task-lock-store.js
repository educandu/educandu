import Database from './database.js';
import LockStoreBase from './lock-store-base.js';

const LOCK_EXPIRATION_TIME_SPAN = { minutes: 10 };

class TaskLockStore extends LockStoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.taskLocks, LOCK_EXPIRATION_TIME_SPAN);
  }
}

export default TaskLockStore;
