import url from 'url';
import glob from 'glob';
import { promisify } from 'util';
import { ROLE } from '../src/domain/role.js';
import testHelper from '../src/test-helper.js';
import Database from '../src/stores/database.js';
import fileHelper from '../src/utils/file-helper.js';
import UserService from '../src/services/user-service.js';
import SettingService from '../src/services/setting-service.js';
import DocumentService from '../src/services/document-service.js';
import serverBootstrapper from '../src/bootstrap/server-bootstrapper.js';

const globP = promisify(glob);

const ROLES_USER = [ROLE.user];
const ROLES_EDITOR = [ROLE.user, ROLE.editor];
const ROLES_SUPER_EDITOR = [ROLE.user, ROLE.editor, ROLE.superEditor];
const ROLES_SUPER_USER = [ROLE.user, ROLE.editor, ROLE.superEditor, ROLE.superUser];

(async function seed() {

  const container = await serverBootstrapper.createContainer();
  const db = container.get(Database);
  const userService = container.get(UserService);
  const settingService = container.get(SettingService);
  const documentService = container.get(DocumentService);

  await testHelper.dropAllCollections(db);

  const user = await testHelper.createAndVerifyUser(userService, 'test', 'test', 'test@test.com', ROLES_SUPER_USER);
  await testHelper.createAndVerifyUser(userService, 'test-user', 'test-user', 'test-user@test.com', ROLES_USER);
  await testHelper.createAndVerifyUser(userService, 'test-editor', 'test-editor', 'test-editor@test.com', ROLES_EDITOR);
  await testHelper.createAndVerifyUser(userService, 'test-super-editor', 'test-super-editor', 'test-super-editor@test.com', ROLES_SUPER_EDITOR);
  await testHelper.createAndVerifyUser(userService, 'test-super-user', 'test-super-user', 'test-super-user@test.com', ROLES_SUPER_USER);
  await testHelper.createAndVerifyUser(userService, 'admin', '#smBW8#7aiFWKBA', 'admin@test.com', ROLES_SUPER_USER);

  const docFiles = await globP(url.fileURLToPath(new URL('../test/test-docs/*.json', import.meta.url).href));

  const docPayloads = await Promise.all(docFiles.map(file => fileHelper.readJson(file)));

  docPayloads.forEach(payload => {
    payload.user = user;
  });

  const docs = await Promise.all(docPayloads.map(payload => documentService.createDocumentRevision(payload)));

  const homePageKey = docs.find(doc => doc.title === 'Landing Page').key;
  await settingService.saveSettings({
    homeLanguages: [
      {
        language: 'de',
        documentKey: homePageKey,
        searchFieldButton: 'Suchen mit Google',
        searchFieldPlaceholder: 'Suchbegriff'
      },
      {
        language: 'en',
        documentKey: homePageKey,
        searchFieldButton: 'Search with Google',
        searchFieldPlaceholder: 'Search term'
      },
      {
        language: 'it',
        documentKey: homePageKey,
        searchFieldButton: 'Ricercare con Google',
        searchFieldPlaceholder: 'Termine di ricerca'
      },
      {
        language: 'fr',
        documentKey: homePageKey,
        searchFieldButton: 'Rechercher par Google',
        searchFieldPlaceholder: 'Terme de recherche'
      }
    ],
    helpPage: {
      de: { linkTitle: 'Hilfe', documentNamespace: 'articles', documentSlug: 'hilfe' },
      en: { linkTitle: 'Help', documentNamespace: 'articles', documentSlug: 'help' }
    },
    termsPage: {
      de: { linkTitle: 'Nutzungsvertrag', documentNamespace: 'articles', documentSlug: 'nutzungsvertrag' },
      en: { linkTitle: 'Terms of usage', documentNamespace: 'articles', documentSlug: 'terms' }
    },
    footerLinks: {
      de: [
        { linkTitle: 'Über ELMU', documentNamespace: 'articles', documentSlug: 'ueber-elmu' },
        { linkTitle: 'Organisation', documentNamespace: 'articles', documentSlug: 'organisation' },
        { linkTitle: 'Nutzungsvertrag', documentNamespace: 'articles', documentSlug: 'nutzungsvertrag' },
        { linkTitle: 'Datenschutz', documentNamespace: 'articles', documentSlug: 'datenschutz' }
      ],
      en: [
        { linkTitle: 'About ELMU', documentNamespace: 'articles', documentSlug: 'about-elmu' },
        { linkTitle: 'Organization', documentNamespace: 'articles', documentSlug: 'organization' },
        { linkTitle: 'Terms of usage', documentNamespace: 'articles', documentSlug: 'terms' },
        { linkTitle: 'Data protection', documentNamespace: 'articles', documentSlug: 'data-protection' }
      ]
    },
    defaultTags: ['Hilfe', 'Hochschule', 'Musiktheorie']
  });

  await serverBootstrapper.disposeContainer(container);

})();
