import Database from './database.js';
import StoreBase from './store-base.js';

class TaskStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.tasks);
  }
}

export default TaskStore;
