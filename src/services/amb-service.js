import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import cloneDeep from '../utils/clone-deep.js';
import UserStore from '../stores/user-store.js';
import SettingStore from '../stores/setting-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

const defaultMetadata = {
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
  ]
};

class AmbService {
  static get inject() { return [ServerConfig, DocumentStore, UserStore, SettingStore]; }

  constructor(serverConfig, documentStore, userStore, settingStore) {
    this.userStore = userStore;
    this.serverConfig = serverConfig;
    this.documentStore = documentStore;
    this.settingStore = settingStore;
  }

  async getDocumentsAmbMetadata({ origin }) {
    const docs = await this.documentStore.getPublicNonArchivedTaggedDocumentsExtendedMetadata();

    const userIds = extractUserIdsFromDocsOrRevisions(docs);
    const userObjects = await this.userStore.getUsersByIds(userIds);
    const userMap = userObjects.reduce((map, user) => ({ ...map, [user._id]: user }), {});

    const allSettings = await this.settingStore.getAllSettings();
    const licenseSetting = allSettings.find(setting => setting._id === 'license');
    const licenseUrl = licenseSetting?.value?.url || null;

    return docs.map(doc => {
      const createdByUser = userMap[doc.createdBy];
      const contributorUsers = doc.contributors.map(contributorId => userMap[contributorId]);
      const result = cloneDeep(defaultMetadata);

      result.id = urlUtils.concatParts(origin, routes.getDocUrl({ id: doc._id }));
      result.name = doc.title;
      result.creator = [{ type: 'Person', name: createdByUser.displayName }];
      result.contributor = contributorUsers.map(user => ({ type: 'Person', name: user.displayName }));
      result.description = doc.description;
      result.keywords = doc.tags;
      if (licenseUrl) {
        result.license = { id: licenseUrl };
      }
      result.dateCreated = doc.createdOn.toISOString();
      result.datePublished = doc.createdOn.toISOString();
      result.inLanguage = [doc.language];

      if (this.serverConfig.ambConfig?.publisher) {
        result.publisher = this.serverConfig.ambConfig.publisher;
      }
      if (this.serverConfig.ambConfig?.image) {
        result.image = urlUtils.ensureIsFullyQualifiedUrl(this.serverConfig.ambConfig.image, origin);
      }
      if (this.serverConfig.ambConfig?.about) {
        result.about = this.serverConfig.ambConfig.about;
      }

      return result;
    });
  }
}

export default AmbService;
