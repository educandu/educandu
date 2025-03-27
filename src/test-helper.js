import mime from 'mime';
import Cdn from './stores/cdn.js';
import deepEqual from 'fast-deep-equal';
import Database from './stores/database.js';
import uniqueId from './utils/unique-id.js';
import urlUtils from './utils/url-utils.js';
import UserStore from './stores/user-store.js';
import { DISPOSAL_PRIORITY } from './common/di.js';
import UserService from './services/user-service.js';
import SettingService from './services/setting-service.js';
import { getResourceType } from './utils/resource-utils.js';
import DocumentService from './services/document-service.js';
import { getDocumentInputMediaPath } from './utils/storage-utils.js';
import DocumentInputService from './services/document-input-service.js';
import GithubFlavoredMarkdown from './common/github-flavored-markdown.js';
import DocumentCommentService from './services/document-comment-service.js';
import DocumentCategoryService from './services/document-category-service.js';
import { createDocumentInputUploadedFileName } from './utils/document-input-utils.js';
import { createContainer, disposeContainer } from './bootstrap/server-bootstrapper.js';
import { CDN_URL_PREFIX, DEFAULT_CONTENT_TYPE, SAVE_USER_RESULT } from './domain/constants.js';

async function purgeDatabase(db) {
  const collections = await db._db.collections();
  await Promise.all(collections.map(col => col.deleteMany({})));
}

export async function setupTestEnvironment() {
  const randomId = uniqueId.create().toLowerCase();

  const region = 'eu-central-1';
  const bucketName = `test-educandu-cdn-${randomId}`;

  const container = await createContainer({
    appName: 'test',
    appRootUrl: 'http://localhost:3000',
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
    announcementCookieNamePrefix: 'ANNOUNCEMENT',
    emailSenderAddress: 'educandu-test-app@test.com',
    emailAddressIgnorePattern: null,
    smtpOptions: 'smtp://localhost:8025/?ignoreTLS=true',
    disableScheduling: true,
    customResolvers: {
      resolveCustomPageTemplate: null,
      resolveCustomHomePageTemplate: null,
      resolveCustomSiteLogo: null,
      resolveCustomPluginInfos: null
    },
    plugins: [
      'markdown',
      'markdown-with-image',
      'image',
      'catalog',
      'annotation',
      'audio',
      'video',
      'table',
      'pdf-viewer',
      'table-of-contents',
      'matching-cards',
      'diagram-net',
      'iframe',
      'abc-notation',
      'music-xml-viewer',
      'quick-tester',
      'ear-training',
      'audio-waveform',
      'media-slideshow',
      'interactive-media',
      'multitrack-media',
      'media-analysis'
    ]
  });

  // Fake the whole CDN for tests:
  container.registerInstance(Cdn, {
    uploadObject: () => Promise.resolve(),
    moveObject: () => Promise.resolve(),
    deleteObject: () => Promise.resolve(),
    ensureDirectory: () => Promise.resolve(),
    deleteDirectory: () => Promise.resolve(),
    getDisposalInfo: () => ({
      priority: DISPOSAL_PRIORITY.storage,
      dispose: () => Promise.resolve()
    })
  });

  // Run the DB check in order to create all collections and indexes:
  const db = container.get(Database);
  await db.checkDb();

  return container;
}

export async function pruneTestEnvironment(container) {
  return Promise.all([
    await purgeDatabase(container.get(Database))
  ]);
}

export async function destroyTestEnvironment(container) {
  const db = container.get(Database);

  await db._db.dropDatabase();
  await disposeContainer(container);
}

export async function createTestUser(container, { email, password, displayName, ...otherUserValues } = {}) {
  const userStore = container.get(UserStore);
  const userService = container.get(UserService);
  const gfm = container.get(GithubFlavoredMarkdown);

  const { result, user } = await userService.createUser({
    email: email || 'test@test@com',
    password: password || 'test',
    displayName: displayName || 'Testibus',
    verified: true
  });

  if (result !== SAVE_USER_RESULT.success) {
    throw new Error(JSON.stringify({ result, email, password, displayName }));
  }

  const updatedUser = { ...user, ...otherUserValues };
  updatedUser.cdnResources = gfm.extractCdnResources(updatedUser.profileOverview || '');

  if (!deepEqual(updatedUser, user)) {
    await userStore.saveUser(updatedUser);
  }

  return updatedUser;
}

export async function updateTestUser(container, user) {
  const userStore = container.get(UserStore);
  await userStore.saveUser(user);
}

export async function createTestRoom(container, roomValues = {}) {
  const db = container.get(Database);
  const gfm = container.get(GithubFlavoredMarkdown);

  const now = new Date();
  const creatorAndOwner = uniqueId.create();

  const room = {
    _id: roomValues._id || uniqueId.create(),
    slug: roomValues.slug || '',
    name: roomValues.name || 'my-room',
    shortDescription: roomValues.shortDescription || '',
    isCollaborative: roomValues.isCollaborative || false,
    ownedBy: roomValues.ownedBy || creatorAndOwner,
    createdBy: roomValues.createdBy || creatorAndOwner,
    createdOn: roomValues.createdOn || now,
    updatedOn: roomValues.updatedOn || now,
    overview: roomValues.overview || '',
    cdnResources: gfm.extractCdnResources(roomValues.overview || ''),
    members: roomValues.members || [],
    messages: roomValues.messages || [],
    documents: roomValues.documents || []
  };
  await db.rooms.insertOne(room);
  return room;
}

export function createTestDocumentComment(container, user, data) {
  const documentCommentService = container.get(DocumentCommentService);

  return documentCommentService.createDocumentComment({
    data: {
      documentId: uniqueId.create(),
      topic: 'Test comment topic',
      text: 'Test comment text',
      ...data
    },
    user
  });
}

export function createTestDocumentCategory(container, user, data) {
  const documentCategoryService = container.get(DocumentCategoryService);

  return documentCategoryService.createDocumentCategory({
    name: 'Test Category',
    iconUrl: '',
    description: '',
    ...data,
    user
  });
}

export function createTestDocumentInput(container, user, data) {
  const documentInputService = container.get(DocumentInputService);

  const files = Object.entries(data.sections)
    .flatMap(([sectionKey, section]) => section.files.map(sectionFile => ({
      originalname: createDocumentInputUploadedFileName(sectionKey, sectionFile.key),
      size: 1024,
      path: '/test.jpg'
    })));

  return documentInputService.createDocumentInput({
    documentId: data.documentId,
    documentRevisionId: data.documentRevisionId,
    sections: data.sections,
    files,
    user,
    silentCreation: true
  });
}

export async function createTestDocumentInputMediaItem(container, user, data) {
  const now = new Date();
  const db = container.get(Database);

  const roomId = data.roomId || uniqueId.create();
  const documentInputId = data.documentInputId || uniqueId.create();
  const url = data.url || `${CDN_URL_PREFIX}${urlUtils.concatParts(getDocumentInputMediaPath({ roomId, documentInputId }), `${uniqueId.create()}.txt`)}`;
  const newItem = {
    _id: uniqueId.create(),
    roomId,
    documentInputId,
    resourceType: data.resourceType || getResourceType(url),
    contentType: data.contentType || mime.getType(url) || DEFAULT_CONTENT_TYPE,
    size: data.size || 1,
    createdBy: data.createdBy || user._id,
    createdOn: data.createdOn || now,
    url,
    name: data.name || urlUtils.getFileName(url)
  };

  await db.documentInputMediaItems.insertOne(newItem);
  return newItem;
}

export function createTestDocument(container, user, data) {
  const documentService = container.get(DocumentService);

  return documentService.createDocument({
    data: {
      ...data,
      title: data.title ?? 'Title',
      shortDescription: data.shortDescription ?? 'Description',
      slug: data.slug ?? 'my-doc',
      language: data.language ?? 'en',
      publicContext: data.roomId
        ? null
        : {
          allowedEditors: [],
          protected: false,
          archived: false,
          verified: false,
          review: '',
          ...data.publicContext
        },
      roomContext: data.roomId
        ? {
          draft: false,
          inputSubmittingDisabled: false,
          ...data.roomContext
        }
        : null
    },
    user,
    silentCreation: true
  });
}

export function updateTestDocument({ container, documentId, user, data }) {
  const documentService = container.get(DocumentService);
  return documentService.updateDocument({ documentId, user, data, silentUpdate: true });
}

export function hardDeletePrivateTestDocument({ container, documentId, user }) {
  const documentService = container.get(DocumentService);
  return documentService.hardDeletePrivateDocument({ documentId, user });
}

export async function createTestRevisions(container, user, revisions) {
  const documentService = container.get(DocumentService);
  let lastCreatedDocument = null;

  for (const revision of revisions) {
    const data = {
      title: revision.title ?? lastCreatedDocument?.title ?? 'Title',
      shortDescription: revision.shortDescription ?? lastCreatedDocument?.shortDescription ?? 'Description',
      slug: revision.slug ?? lastCreatedDocument?.slug ?? 'my-doc',
      language: revision.language ?? lastCreatedDocument?.language ?? 'en',
      sections: (revision.sections ?? lastCreatedDocument?.sections ?? []).map(s => ({
        key: s.key ?? uniqueId.create(),
        type: s.type ?? 'markdown',
        content: s.content ?? {}
      })),
      roomId: revision.roomId,
      publicContext: revision.roomId
        ? null
        : {
          allowedEditors: [],
          protected: false,
          archived: false,
          verified: false,
          review: '',
          ...revision.publicContext
        },
      roomContext: revision.roomId
        ? {
          draft: false,
          ...revision.roomContext
        }
        : null
    };

    lastCreatedDocument = lastCreatedDocument
      ? await documentService.updateDocument({ documentId: lastCreatedDocument._id, data, user, silentUpdate: true })
      : await documentService.createDocument({ data, user, silentCreation: true });
  }

  return lastCreatedDocument
    ? documentService.getAllDocumentRevisionsByDocumentId(lastCreatedDocument._id)
    : [];
}

export function createTestSection(data = {}) {
  return {
    revision: uniqueId.create(),
    key: uniqueId.create(),
    deletedOn: null,
    deletedBy: null,
    deletedBecause: null,
    type: null,
    content: null,
    ...data
  };
}

export async function createTestSetting(container, { name, value }) {
  const settingService = container.get(SettingService);

  const settings = await settingService.getAllSettings();
  settings[name] = value;

  return settingService.saveSettings(settings);
}
