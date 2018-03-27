const Database = require('./database');

function createTestDatabase() {
  const settings = {
    dbConnectionString: 'mongodb://elmu:elmu@localhost:27017',
    dbName: `test-${Date.now()}`
  };
  return Database.create(settings);
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
