import del from 'del';
import url from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import Cdn from './repositories/cdn.js';
import Database from './stores/database.js';
import uniqueId from './utils/unique-id.js';
import UserStore from './stores/user-store.js';
import UserService from './services/user-service.js';
import DocumentService from './services/document-service.js';
import { createContainer, disposeContainer } from './bootstrap/server-bootstrapper.js';
import { ROLE, ROOM_ACCESS, ROOM_DOCUMENTS_MODE, SAVE_USER_RESULT } from './domain/constants.js';

export async function createTestDir() {
  const tempDir = url.fileURLToPath(new URL('../.test/', import.meta.url).href);
  try {
    await fs.mkdir(tempDir);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const prefix = path.join(tempDir, './test-');
  return fs.mkdtemp(prefix);
}

export function deleteTestDir(testDir) {
  return del(testDir);
}

async function purgeDatabase(db) {
  const collections = await db._db.collections();
  await Promise.all(collections.map(col => col.deleteMany({})));
}

// If `bucketName` is undefined, it uses the
// bucket associated with `cdn`!
async function purgeBucket(cdn, bucketName) {
  const s3Client = cdn.s3Client;
  const bName = bucketName || cdn.bucketName;
  const objects = await s3Client.listObjects(bName, '', true);
  await s3Client.deleteObjects(bName, objects.map(obj => obj.name));
}

async function removeBucket(cdn) {
  const s3Client = cdn.s3Client;
  await purgeBucket(cdn, cdn.bucketName);
  await s3Client.deleteBucket(cdn.bucketName);
}

export async function setupTestEnvironment() {
  const randomId = uniqueId.create().toLowerCase();

  const region = 'eu-central-1';
  const bucketName = `test-educandu-cdn-${randomId}`;

  const container = await createContainer({
    appName: 'test',
    mongoConnectionString: `mongodb://root:rootpw@localhost:27017/test-educandu-db-${randomId}?replicaSet=educandurs&authSource=admin`,
    cdnEndpoint: 'http://localhost:9000',
    cdnRegion: region,
    cdnAccessKey: 'UVDXF41PYEAX0PXD8826',
    cdnSecretKey: 'SXtajmM3uahrQ1ALECh3Z3iKT76s2s5GBJlbQMZx',
    cdnBucketName: bucketName,
    cdnRootUrl: `http://localhost:9000/${bucketName}`,
    sessionSecret: 'd4340515fa834498b3ab1aba1e4d9013',
    sessionCookieName: 'SESSION_ID',
    consentCookieNamePrefix: 'CONSENT',
    uploadLiabilityCookieName: 'LIABILITY',
    emailSenderAddress: 'educandu-test-app@test.com',
    smtpOptions: 'smtp://localhost:8025/?ignoreTLS=true',
    bundleConfig: {
      getPageTemplateComponent: () => Promise.resolve(null),
      getHomePageTemplateComponent: () => Promise.resolve(null),
      getSiteLogoComponent: () => Promise.resolve(null)
    },
    plugins: [
      'markdown',
      'quick-tester',
      'audio',
      'video',
      'image',
      'pdf-viewer',
      'iframe',
      'anavis',
      'image-tiles',
      'diagram-net',
      'annotation',
      'abc-notation',
      'ear-training',
      'interval-trainer'
    ]
  });

  // Run the DB check in order to create all collections and indexes:
  const db = container.get(Database);
  await db.checkDb();

  // Make bucket publicly accessible:
  const cdn = container.get(Cdn);
  const s3Client = cdn.s3Client;
  await s3Client.createBucket(bucketName, region);
  await s3Client.putBucketPolicy(bucketName, JSON.stringify({
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
  }));

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
    await db._db.dropDatabase()
  ]);

  await disposeContainer(container);
}

export async function setupTestUser(container, userValues) {
  const userStore = container.get(UserStore);
  const userService = container.get(UserService);

  const username = userValues?.username || 'test';
  const password = userValues?.password || 'test';
  const email = userValues?.email || 'test@test@com';
  const roles = userValues?.roles || [ROLE.user];
  const profile = userValues?.profile || null;
  const lockedOut = userValues?.lockedOut || false;

  const { result, user } = await userService.createUser({ username, password, email });
  if (result !== SAVE_USER_RESULT.success) {
    throw new Error(JSON.stringify({ result, username, password, email }));
  }
  const verifiedUser = await userService.verifyUser(user.verificationCode);
  verifiedUser.roles = roles;
  verifiedUser.profile = profile || null;
  verifiedUser.lockedOut = lockedOut || false;
  verifiedUser.accountClosedOn = userValues?.accountClosedOn || null;
  verifiedUser.storage = userValues?.storage || { plan: null, usedBytes: 0, reminders: [] };
  await userStore.saveUser(verifiedUser);
  return verifiedUser;
}

export async function createTestRoom(container, roomValues) {
  const db = container.get(Database);

  const room = {
    _id: roomValues._id || uniqueId.create(),
    name: roomValues.name || 'my-room',
    access: roomValues.access || ROOM_ACCESS.public,
    documentsMode: roomValues.documentsMode || ROOM_DOCUMENTS_MODE.exclusive,
    owner: roomValues.owner || uniqueId.create(),
    createdBy: roomValues.createdBy || uniqueId.create(),
    createdOn: roomValues.createdOn || new Date(),
    members: roomValues.members || []
  };
  await db.rooms.insertOne(room);
  return room;
}

export function createTestDocument(container, user, data) {
  const documentService = container.get(DocumentService);
  return documentService.createDocument({
    data: {
      ...data,
      title: data.title ?? 'Title',
      description: data.description ?? 'Description',
      slug: data.slug ?? 'my-doc',
      language: data.language ?? 'en'
    },
    user
  });
}

export function updateTestDocument({ container, documentId, user, data }) {
  const documentService = container.get(DocumentService);
  return documentService.updateDocument({ documentId, user, data });
}

export async function createTestRevisions(container, user, revisions) {
  const documentService = container.get(DocumentService);
  let lastCreatedDocument = null;

  for (const revision of revisions) {
    const data = {
      title: revision.title ?? lastCreatedDocument?.title ?? 'Title',
      description: revision.description ?? lastCreatedDocument?.description ?? 'Description',
      slug: revision.slug ?? lastCreatedDocument?.slug ?? 'my-doc',
      language: revision.language ?? lastCreatedDocument?.language ?? 'en',
      sections: (revision.sections ?? lastCreatedDocument?.sections ?? []).map(s => ({
        key: s.key ?? uniqueId.create(),
        type: s.type ?? 'markdown',
        content: s.content ?? {}
      }))
    };

    lastCreatedDocument = lastCreatedDocument
      // eslint-disable-next-line no-await-in-loop
      ? await documentService.updateDocument({ documentId: lastCreatedDocument._id, data, user })
      // eslint-disable-next-line no-await-in-loop
      : await documentService.createDocument({ data, user });
  }

  return lastCreatedDocument
    ? documentService.getAllDocumentRevisionsByDocumentId(lastCreatedDocument._id)
    : [];
}
