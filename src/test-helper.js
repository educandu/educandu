const Database = require('./database');

function createTestDatabase() {
  const tempDbName = `test-elmu-web-${Date.now()}`;
  const connStr = `mongodb://elmu:elmu@localhost:27017/${tempDbName}?authSource=admin`;
  return Database.create(connStr);
}

function dropDatabase(db) {
  return db._db.dropDatabase();
}

async function dropCollectionSafely(coll) {
  await coll.insertOne({});
  await coll.drop();
}

module.exports = {
  createTestDatabase,
  dropDatabase,
  dropCollectionSafely
};
