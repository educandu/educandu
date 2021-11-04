import fs from 'fs';
import del from 'del';
import url from 'url';
import path from 'path';
import util from 'util';
import Cdn from './repositories/cdn.js';
import { ROLE } from './domain/role.js';
import Database from './stores/database.js';
import uniqueId from './utils/unique-id.js';
import UserService from './services/user-service.js';
import ServerConfig from './bootstrap/server-config.js';
import DocumentService from './services/document-service.js';
import { SAVE_USER_RESULT } from './domain/user-management.js';
import { createContainer, disposeContainer } from './bootstrap/server-bootstrapper.js';

const mkdir = util.promisify(fs.mkdir);
const mkdtemp = util.promisify(fs.mkdtemp);
const serverConfig = new ServerConfig({ skipMongoMigrations: true, skipMongoChecks: false });

export async function createTestDir() {
  const tempDir = url.fileURLToPath(new URL('../.tmp/', import.meta.url).href);
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

export function deleteTestDir(testDir) {
  return del(testDir);
}

export function createTestDatabase() {
  const dbUrl = new URL(serverConfig.mongoConnectionString);
  dbUrl.pathname = `test-elmu-web-${Date.now()}`;
  return Database.create({ connectionString: dbUrl.toString() });
}

export function getTestCollection(db, collectionName) {
  return db._db.collection(collectionName);
}

export function dropDatabase(db) {
  return db._db.dropDatabase();
}

export async function dropAllCollections(db) {
  const collections = await db._db.collections();
  await Promise.all(collections.map(col => db._db.dropCollection(col.collectionName)));
}

export async function purgeDatabase(db) {
  const collections = await db._db.collections();
  await Promise.all(collections.map(col => col.deleteMany({})));
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`, same with `region`!
export async function ensurePublicBucketExists(cdn, bucketName, region) {
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

export async function createTestCdn() {
  const cdn = await Cdn.create({
    endpoint: serverConfig.cdnEndpoint,
    region: serverConfig.cdnRegion,
    accessKey: serverConfig.cdnAccessKey,
    secretKey: serverConfig.cdnSecretKey,
    bucketName: `test-elmu-cdn-${Date.now()}`
  });

  return ensurePublicBucketExists(cdn);
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`!
export async function purgeBucket(cdn, bucketName) {
  const s3Client = cdn.s3Client;
  const bName = bucketName || cdn.bucketName;
  const objects = await s3Client.listObjects(bName, '', true);
  await s3Client.deleteObjects(bName, objects.map(obj => obj.name));
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`!
export async function removeBucket(cdn, bucketName) {
  const s3Client = cdn.s3Client;
  const bName = bucketName || cdn.bucketName;
  await purgeBucket(cdn, bName);
  await s3Client.deleteBucket(bName);
}

export async function removeAllBuckets(cdn) {
  const s3Client = cdn.s3Client;

  // eslint-disable-next-line no-console
  console.log('Listing buckets');
  const buckets = await s3Client.listBuckets();

  // eslint-disable-next-line no-console
  console.log(`Found ${buckets.length}`);
  await Promise.all(buckets.map(b => removeBucket(cdn, b.name)));
}

export async function createAndVerifyUser(userService, username, password, email, roles, profile, lockedOut) {
  const { result, user } = await userService.createUser({ username, password, email });
  if (result !== SAVE_USER_RESULT.success) {
    throw new Error(JSON.stringify({ result, username, password, email }));
  }
  const verifiedUser = await userService.verifyUser(user.verificationCode);
  verifiedUser.roles = roles;
  verifiedUser.profile = profile || null;
  verifiedUser.lockedOut = lockedOut || false;
  await userService.saveUser(verifiedUser);
  return verifiedUser;
}

export async function setupTestEnvironment() {
  const timestamp = Date.now().toString();

  const config = new ServerConfig({ env: 'test', skipMongoMigrations: true, skipMongoChecks: false });

  // Configure temp DB parameters:
  const dbUrl = new URL(config.mongoConnectionString);
  dbUrl.pathname = `test-elmu-web-${timestamp}`;
  config.mongoConnectionString = dbUrl.toString();

  // Configure temp CDN parameters:
  const cdnUrl = new URL(config.cdnRootUrl);
  cdnUrl.pathname = `test-elmu-cdn-${timestamp}`;
  config.cdnRootUrl = cdnUrl.toString();
  config.cdnBucketName = `test-elmu-cdn-${timestamp}`;

  // Fire everything up:
  const container = await createContainer(config);

  // Make bucket publicly accessible:
  await ensurePublicBucketExists(container.get(Cdn));

  return container;
}

export async function pruneTestEnvironment(container) {
  return Promise.all([
    await purgeBucket(container.get(Cdn)),
    await purgeDatabase(container.get(Database))
  ]);
}

export async function destroyTestEnvironment(container) {
  const cdn = container.get(Cdn);
  const db = container.get(Database);

  await Promise.all([
    await removeBucket(cdn),
    await dropDatabase(db)
  ]);

  await disposeContainer(container);
}

export function setupTestUser(container, user) {
  return createAndVerifyUser(
    container.get(UserService),
    user?.username || 'test',
    user?.password || 'test',
    user?.email || 'test@test@com',
    user?.roles || [ROLE.user],
    user?.profile || null,
    user?.lockedOut || false
  );
}

export async function createTestRevisions(container, user, revisions) {
  const documentService = container.get(DocumentService);
  const createdRevisions = [];

  for (let index = 0; index < revisions.length; index += 1) {
    const revision = revisions[index];
    const lastCreatedRevision = createdRevisions[createdRevisions.length - 1] || null;

    // eslint-disable-next-line no-await-in-loop
    createdRevisions.push(await documentService.createDocumentRevision({
      doc: {
        title: revision.title ?? lastCreatedRevision?.title ?? 'Title',
        slug: revision.slug ?? lastCreatedRevision?.slug ?? 'my-doc',
        namespace: revision.namespace ?? lastCreatedRevision?.namespace ?? 'articles',
        language: revision.language ?? lastCreatedRevision?.language ?? 'en',
        sections: (revision.sections ?? lastCreatedRevision?.sections ?? []).map(s => ({
          key: s.key ?? uniqueId.create(),
          type: s.type ?? 'markdown',
          content: s.content ?? {}
        })),
        appendTo: lastCreatedRevision
          ? { key: lastCreatedRevision.key, ancestorId: lastCreatedRevision._id }
          : null
      },
      user
    }));
  }

  return createdRevisions;
}

export default {
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
