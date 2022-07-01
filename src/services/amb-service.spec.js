import sinon from 'sinon';
import AmbService from './amb-service.js';
import Database from '../stores/database.js';
import ServerConfig from '../bootstrap/server-config.js';
import {
  createTestDocument,
  destroyTestEnvironment,
  pruneTestEnvironment,
  setupTestEnvironment,
  setupTestUser,
  updateTestDocument
} from '../test-helper.js';

describe('amb-service', () => {
  const now = new Date();
  const origin = 'https://educandu.dev';
  const sandbox = sinon.createSandbox();

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
    let creatorUser;
    let contributorUser;
    let document;

    beforeEach(async () => {
      creatorUser = await setupTestUser(container, { username: 'document_creator', email: 'creator@educandu.dev' });
      contributorUser = await setupTestUser(container, { username: 'document_contributor', email: 'contributor@educandu.dev' });
    });

    describe('when there are no unarchived documents', () => {
      beforeEach(async () => {
        document = await createTestDocument(container, creatorUser, { title: 'Archived document', archived: true });

        result = await sut.getDocumentsAmbMetadata({ origin });
      });

      it('should return an empty array', () => {
        expect(result).toEqual([]);
      });
    });

    describe('when there are unarchived documents', () => {
      beforeEach(async () => {
        document = await createTestDocument(container, creatorUser, {
          title: 'Bach concert',
          description: 'Concert for piano and orchestra',
          tags: ['Music', 'Bach', 'Piano', 'Orchestra'],
          language: 'en'
        });
        await updateTestDocument({ container, documentKey: document._id, user: contributorUser, data: { ...document } });
      });

      describe('and there are no settings or serverConfig', () => {
        beforeEach(async () => {
          result = await sut.getDocumentsAmbMetadata({ origin });
        });

        it('should return the default data with the document metadata mapped into it', () => {
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
              'id': `${origin}/docs/${document._id}`,
              'name': 'Bach concert',
              'creator': [
                {
                  name: 'document_creator',
                  type: 'Person'
                }
              ],
              'contributor': [
                {
                  name: 'document_creator',
                  type: 'Person'
                }, {
                  name: 'document_contributor',
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

        it('should return the default data with the document metadata, settings and serverConfig mapped into it', () => {
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
              'id': `${origin}/docs/${document._id}`,
              'name': 'Bach concert',
              'creator': [
                {
                  name: 'document_creator',
                  type: 'Person'
                }
              ],
              'contributor': [
                {
                  name: 'document_creator',
                  type: 'Person'
                }, {
                  name: 'document_contributor',
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
