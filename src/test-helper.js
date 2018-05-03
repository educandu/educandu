const Database = require('./stores/database');

function createTestDatabase() {
  const tempDbName = `test-elmu-web-${Date.now()}`;
  const connStr = `mongodb://elmu:elmu@localhost:27017/${tempDbName}?authSource=admin`;
  return Database.create(connStr);
}

function getTestCollection(db, collectionName) {
  return db._db.collection(collectionName);
}

function dropDatabase(db) {
  return db._db.dropDatabase();
}

async function dropAllCollections(db) {
  const collections = await db._db.collections();
  await Promise.all(collections.map(col => db._db.dropCollection(col.s.name)));
}

module.exports = {
  createTestDatabase,
  getTestCollection,
  dropDatabase,
  dropAllCollections
};
