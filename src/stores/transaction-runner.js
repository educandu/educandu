import Database from './database.js';

export default class TransactionRunner {
  static dependencies = [Database];

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
