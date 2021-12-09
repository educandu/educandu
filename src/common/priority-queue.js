import { priorityQueue } from 'async';

class PriorityQueue {
  constructor(maxConcurrency) {
    this.tasks = priorityQueue(this._runTask, maxConcurrency);
  }

  _runTask(task, callback) {
    try {
      task.func((err, result) => {
        if (err) {
          task.reject(err);
        } else {
          task.resolve(result);
        }
        callback(err);
      });
    } catch (error) {
      task.reject(error);
    }
  }

  push(func, priority = 0) {
    return new Promise((resolve, reject) => {
      this.tasks.push({ func, reject, resolve }, priority);
    });
  }
}

export default PriorityQueue;
