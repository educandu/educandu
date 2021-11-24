import Database from './database.js';

export default class TransactionRunner {
  static get inject() { return [Database]; }

  constructor(database) {
    this.database = database;
  }

  async run(func) {
    const session = this.database.startSession();
    try {
      await session.withTransaction(() => func(session), { readPreference: 'primary' });
    } finally {
      await session.endSession();
    }
  }
}
