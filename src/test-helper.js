const Database = require('./stores/database');

function createTestDatabase() {
  const tempDbName = `test-elmu-web-${Date.now()}`;
  const connectionString = `mongodb://elmu:elmu@localhost:27017/${tempDbName}?authSource=admin`;
  return Database.create({ connectionString });
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

async function removeAllBuckets(cdn) {
  const minioClient = cdn._minioClient;
  const buckets = await minioClient.listBuckets();
  await Promise.all(buckets.map(b => minioClient.removeBucket(b.name)));
}

async function createElmuCdnBucket(cdn) {
  const minioClient = cdn._minioClient;
  const bucketName = cdn._bucketName;
  const region = cdn._region;
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`
      }
    ]
  };
  await minioClient.makeBucket(bucketName, region);
  await minioClient.setBucketPolicy(bucketName, JSON.stringify(bucketPolicy));
}

module.exports = {
  createTestDatabase,
  getTestCollection,
  dropDatabase,
  dropAllCollections,
  removeAllBuckets,
  createElmuCdnBucket
};
