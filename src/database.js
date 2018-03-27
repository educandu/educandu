const { MongoClient } = require('mongodb');

const DB_COLLECTION_NAME_ARTICLES = 'articles';

class Database {
  constructor({ mongoClient, dbName }) {
    this.mongoClient = mongoClient;
    this.db = this.mongoClient.db(dbName);
    this.articles = this.db.collection(DB_COLLECTION_NAME_ARTICLES);
  }

  async dispose() {
    await this.mongoClient.close();
  }

  static async create({ dbConnectionString, dbName }) {
    const mongoClient = await MongoClient.connect(dbConnectionString);
    return new Database({ mongoClient, dbName });
  }
}

module.exports = Database;
