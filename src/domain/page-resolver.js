import { PAGE_NAME } from './page-name.js';
import DefaultSiteLogoComponent from '../components/default-site-logo.js';
import DefaultPageTemplateComponent from '../components/default-page-template.js';
import {
  browserNotSupportedPage,
  connectExternalAccountPage,
  dashboardPage,
  documentCategoryPage,
  documentInputPage,
  documentPage,
  errorPage,
  indexPage,
  loginPage,
  mediaLibraryItemPage,
  recentContributionsPage,
  registerPage,
  resetPasswordPage,
  revisionPage,
  roomMembershipConfirmationPage,
  roomPage,
  searchPage,
  userProfilePage
} from './page-resolver-primary-pages.js';
import {
  adminPage,
  batchesPage,
  contentManagementPage,
  statisticsPage
} from './page-resolver-secondary-pages.js';

const pageImporters = {
  [PAGE_NAME.room]: async () => await Promise.resolve(roomPage),
  [PAGE_NAME.error]: async () => await Promise.resolve(errorPage),
  [PAGE_NAME.index]: async () => await Promise.resolve(indexPage),
  [PAGE_NAME.login]: async () => await Promise.resolve(loginPage),
  [PAGE_NAME.admin]: async () => await Promise.resolve(adminPage),
  [PAGE_NAME.search]: async () => await Promise.resolve(searchPage),
  [PAGE_NAME.batches]: async () => await Promise.resolve(batchesPage),
  [PAGE_NAME.register]: async () => await Promise.resolve(registerPage),
  [PAGE_NAME.document]: async () => await Promise.resolve(documentPage),
  [PAGE_NAME.revision]: async () => await Promise.resolve(revisionPage),
  [PAGE_NAME.dashboard]: async () => await Promise.resolve(dashboardPage),
  [PAGE_NAME.statistics]: async () => await Promise.resolve(statisticsPage),
  [PAGE_NAME.userProfile]: async () => await Promise.resolve(userProfilePage),
  [PAGE_NAME.documentInput]: async () => await Promise.resolve(documentInputPage),
  [PAGE_NAME.resetPassword]: async () => await Promise.resolve(resetPasswordPage),
  [PAGE_NAME.tests]: async () => (await import('../components/pages/tests.js')).default,
  [PAGE_NAME.documentCategory]: async () => await Promise.resolve(documentCategoryPage),
  [PAGE_NAME.mediaLibraryItem]: async () => await Promise.resolve(mediaLibraryItemPage),
  [PAGE_NAME.contentManagement]: async () => await Promise.resolve(contentManagementPage),
  [PAGE_NAME.recentContributions]: async () => await Promise.resolve(recentContributionsPage),
  [PAGE_NAME.browserNotSupported]: async () => await Promise.resolve(browserNotSupportedPage),
  [PAGE_NAME.comparison]: async () => (await import('../components/pages/comparison.js')).default,
  [PAGE_NAME.connectExternalAccount]: async () => await Promise.resolve(connectExternalAccountPage),
  [PAGE_NAME.roomMembershipConfirmation]: async () => await Promise.resolve(roomMembershipConfirmationPage),
};

export default class PageResolver {
  constructor(customResolvers) {
    this.customResolvers = customResolvers;
    this.cache = null;
  }

  async getPageComponentInfo(pageName) {
    if (!(pageName in pageImporters)) {
      throw new Error(`Invalid page name: '${pageName}'`);
    }

    const [
      PageComponent,
      PageTemplateComponent,
      HomePageTemplateComponent,
      SiteLogoComponent
    ] = await Promise.all([
      pageImporters[pageName](),
      this.customResolvers.resolveCustomPageTemplate?.(pageName) || DefaultPageTemplateComponent,
      this.customResolvers.resolveCustomHomePageTemplate?.(pageName) || DefaultPageTemplateComponent,
      this.customResolvers.resolveCustomSiteLogo?.(pageName) || DefaultSiteLogoComponent
    ]);

    return {
      PageComponent,
      PageTemplateComponent,
      HomePageTemplateComponent,
      SiteLogoComponent
    };
  }

  getCachedPageComponentInfo(pageName) {
    if (!this.cache) {
      throw new Error('Cached execution is only possible after prefilling the cache');
    }

    if (!(pageName in this.cache)) {
      throw new Error(`Invalid page name: '${pageName}'`);
    }

    return this.cache[pageName];
  }

  async _prefillCache(pageNames) {
    const getEntryFromPageName = async pageName => [pageName, await this.getPageComponentInfo(pageName)];
    const allEntries = await Promise.all(pageNames.map(pageName => getEntryFromPageName(pageName)));
    this.cache = Object.fromEntries(allEntries);
  }

  ensurePageIsCached(pageName) {
    return this._prefillCache([pageName]);
  }

  ensureAllPagesAreCached() {
    return this._prefillCache(Object.keys(pageImporters));
  }
}
