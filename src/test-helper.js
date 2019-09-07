const fs = require('fs');
const del = require('del');
const path = require('path');
const util = require('util');
const { URL } = require('url');
const Cdn = require('./repositories/cdn');
const Database = require('./stores/database');
const ServerSettings = require('./bootstrap/server-settings');
const { CREATE_USER_RESULT_SUCCESS } = require('./domain/user-management');

const mkdir = util.promisify(fs.mkdir);
const mkdtemp = util.promisify(fs.mkdtemp);
const serverSettings = new ServerSettings();

async function createTestDir() {
  const tempDir = path.join(__dirname, '../.tmp/');
  try {
    await mkdir(tempDir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const prefix = path.join(tempDir, './test-');
  return mkdtemp(prefix);
}

function deleteTestDir(testDir) {
  return del(testDir);
}

function createTestDatabase() {
  const url = new URL(serverSettings.elmuWebConnectionString);
  url.pathname = `test-elmu-web-${Date.now()}`;
  return Database.create({ connectionString: url.toString() });
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

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`, same with `region`!
async function ensurePublicBucketExists(cdn, bucketName, region) {
  const bRegion = region || cdn.region;
  const bName = bucketName || cdn.bucketName;
  const bucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bName}/*`
      }
    ]
  };

  const s3Client = cdn.s3Client;
  await s3Client.createBucket(bName, bRegion);
  await s3Client.putBucketPolicy(bName, JSON.stringify(bucketPolicy));

  return cdn;
}

async function createTestCdn() {
  const cdn = await Cdn.create({
    endpoint: serverSettings.cdnEndpoint,
    region: serverSettings.cdnRegion,
    accessKey: serverSettings.cdnAccessKey,
    secretKey: serverSettings.cdnSecretKey,
    bucketName: `test-elmu-cdn-${Date.now()}`
  });

  return ensurePublicBucketExists(cdn);
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`!
async function purgeBucket(cdn, bucketName) {
  const s3Client = cdn.s3Client;
  const bName = bucketName || cdn.bucketName;
  const objects = await s3Client.listObjects(bName, '', true);
  await s3Client.deleteObjects(bName, objects.map(obj => obj.name));
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`!
async function removeBucket(cdn, bucketName) {
  const s3Client = cdn.s3Client;
  const bName = bucketName || cdn.bucketName;
  await purgeBucket(cdn, bName);
  await s3Client.deleteBucket(bName);
}

async function removeAllBuckets(cdn) {
  const s3Client = cdn.s3Client;
  const buckets = await s3Client.listBuckets();
  await Promise.all(buckets.map(b => removeBucket(cdn, b.name)));
}

async function createAndVerifyUser(userService, username, password, email, roles, profile, lockedOut) {
  const { result, user } = await userService.createUser(username, password, email);
  if (result !== CREATE_USER_RESULT_SUCCESS) {
    throw new Error(JSON.stringify({ result, username, password, email }));
  }
  const verifiedUser = await userService.verifyUser(user.verificationCode);
  verifiedUser.roles = roles;
  verifiedUser.profile = profile || null;
  verifiedUser.lockedOut = lockedOut || false;
  await userService.saveUser(verifiedUser);
  return verifiedUser;
}

module.exports = {
  createTestDir,
  deleteTestDir,
  createTestDatabase,
  getTestCollection,
  dropDatabase,
  dropAllCollections,
  ensurePublicBucketExists,
  createTestCdn,
  purgeBucket,
  removeBucket,
  removeAllBuckets,
  createAndVerifyUser
};
