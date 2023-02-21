import { createSandbox } from 'sinon';
import AmbService from './amb-service.js';
import Database from '../stores/database.js';
import { ROLE } from '../domain/constants.js';
import ServerConfig from '../bootstrap/server-config.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createTestDocument,
  createTestRoom,
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  setupTestUser,
  updateTestDocument
} from '../test-helper.js';

describe('amb-service', () => {
  const now = new Date();
  const origin = 'https://educandu.dev';
  const sandbox = createSandbox();

  let db;
  let sut;
  let result;
  let container;
  let serverConfig;

  beforeAll(async () => {
    container = await setupTestEnvironment();

    db = container.get(Database);
    serverConfig = container.get(ServerConfig);

    sut = container.get(AmbService);
  });

  beforeEach(() => {
    sandbox.useFakeTimers(now);
  });

  afterAll(async () => {
    await destroyTestEnvironment(container);
  });

  afterEach(async () => {
    await pruneTestEnvironment(container);
    sandbox.restore();
  });

  describe('getDocumentsAmbMetadata', () => {
    let adminUser;
    let creatorUser;
    let contributorUser;
    let document1;
    let document2;

    beforeEach(async () => {
      adminUser = await setupTestUser(container, { email: 'admin@educandu.dev', displayName: 'Admin', roles: Object.values(ROLE) });
      creatorUser = await setupTestUser(container, { email: 'creator@educandu.dev', displayName: 'Document Creator', roles: [ROLE.user] });
      contributorUser = await setupTestUser(container, { email: 'contributor@educandu.dev', displayName: 'Document Contributor', roles: [ROLE.user] });
    });

    describe('when there are no unarchived public documents', () => {
      beforeEach(async () => {
        document1 = await createTestDocument(container, creatorUser, {
          title: 'Document that will be archived soon',
          roomId: null
        });

        await updateTestDocument({ container, documentId: document1._id, user: adminUser, data: { publicContext: { archived: true } } });

        result = await sut.getDocumentsAmbMetadata({ origin });
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are unarchived public documents', () => {
      beforeEach(async () => {
        document1 = await createTestDocument(container, creatorUser, {
          title: 'Bach concert',
          description: 'Concert for piano and orchestra',
          tags: ['Music', 'Bach', 'Piano', 'Orchestra'],
          language: 'en',
          publicContext: { archived: false }
        });
        await updateTestDocument({ container, documentId: document1._id, user: contributorUser, data: { ...document1 } });
        document2 = await createTestDocument(container, creatorUser, {
          title: 'Beethoven concert',
          description: 'Draft document',
          tags: [],
          language: 'en',
          roomId: null,
          publicContext: { archived: false }
        });
        await updateTestDocument({ container, documentId: document2._id, user: contributorUser, data: { ...document2 } });
        const room = createTestRoom(container, { owner: creatorUser._id });
        await createTestDocument(container, creatorUser, {
          title: 'Private closed-doors concert',
          description: 'Room document',
          tags: [],
          language: 'en',
          roomId: room._id,
          publicContext: null,
          roomContext: { draft: false }
        });
      });

      describe('and there are no settings or serverConfig', () => {
        beforeEach(async () => {
          result = await sut.getDocumentsAmbMetadata({ origin });
        });

        it('should return the default data with the tagged document\'s metadata mapped into it', () => {
          expect(result).toEqual([
            {
              '@context': [
                'https://w3id.org/kim/amb/draft/context.jsonld',
                {
                  '@language': 'de'
                }
              ],
              'type': [
                'LearningResource',
                'WebContent',
                'Article'
              ],
              'isAccessibleForFree': true,
              'learningResourceType': [
                {
                  id: 'https://w3id.org/kim/hcrt/web_page',
                  prefLabel: {
                    de: 'Webseite',
                    en: 'Web page'
                  }
                }
              ],
              'publisher': [
                {
                  type: 'Organization',
                  name: 'educandu'
                }
              ],
              'id': `${origin}/docs/${document1._id}`,
              'name': 'Bach concert',
              'creator': [
                {
                  name: 'Document Creator',
                  type: 'Person'
                }
              ],
              'contributor': [
                {
                  name: 'Document Creator',
                  type: 'Person'
                }, {
                  name: 'Document Contributor',
                  type: 'Person'
                }
              ],
              'description': 'Concert for piano and orchestra',
              'keywords': ['Music', 'Bach', 'Piano', 'Orchestra'],
              'dateCreated': now.toISOString(),
              'datePublished': now.toISOString(),
              'inLanguage': ['en']
            }
          ]);
        });
      });

      describe('and there both settings or ambConfig', () => {
        beforeEach(async () => {
          await db.settings.insertOne({ _id: 'license', value: { url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.de' } });

          sandbox.stub(serverConfig, 'ambConfig').value({
            publisher: [
              {
                type: 'Organization',
                name: 'Custom Publisher'
              }
            ],
            image: 'https://educandu.dev/image.jpeg',
            about: [
              {
                id: 'https://w3id.org/kim/hochschulfaechersystematik/n78'
              }
            ]
          });

          result = await sut.getDocumentsAmbMetadata({ origin });
        });

        it('should return the default data with the tagged document\'s metadata, settings and serverConfig mapped into it', () => {
          expect(result).toEqual([
            {
              '@context': [
                'https://w3id.org/kim/amb/draft/context.jsonld',
                {
                  '@language': 'de'
                }
              ],
              'type': [
                'LearningResource',
                'WebContent',
                'Article'
              ],
              'isAccessibleForFree': true,
              'learningResourceType': [
                {
                  id: 'https://w3id.org/kim/hcrt/web_page',
                  prefLabel: {
                    de: 'Webseite',
                    en: 'Web page'
                  }
                }
              ],
              'publisher': [
                {
                  type: 'Organization',
                  name: 'Custom Publisher'
                }
              ],
              'about': [{ id: 'https://w3id.org/kim/hochschulfaechersystematik/n78' }],
              'id': `${origin}/docs/${document1._id}`,
              'name': 'Bach concert',
              'creator': [
                {
                  name: 'Document Creator',
                  type: 'Person'
                }
              ],
              'contributor': [
                {
                  name: 'Document Creator',
                  type: 'Person'
                }, {
                  name: 'Document Contributor',
                  type: 'Person'
                }
              ],
              'description': 'Concert for piano and orchestra',
              'keywords': ['Music', 'Bach', 'Piano', 'Orchestra'],
              'license': {
                id: 'https://creativecommons.org/licenses/by-sa/4.0/deed.de'
              },
              'dateCreated': now.toISOString(),
              'datePublished': now.toISOString(),
              'inLanguage': ['en'],
              'image': 'https://educandu.dev/image.jpeg'
            }
          ]);
        });
      });
    });
  });
});
