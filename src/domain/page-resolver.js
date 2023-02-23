import { PAGE_NAME } from './page-name.js';
import DefaultSiteLogoComponent from '../components/default-site-logo.js';
import DefaultPageTemplateComponent from '../components/default-page-template.js';

const pageImporters = {
  [PAGE_NAME.doc]: async () => (await import('../components/pages/doc.js')).default,
  [PAGE_NAME.room]: async () => (await import('../components/pages/room.js')).default,
  [PAGE_NAME.index]: async () => (await import('../components/pages/index.js')).default,
  [PAGE_NAME.login]: async () => (await import('../components/pages/login.js')).default,
  [PAGE_NAME.admin]: async () => (await import('../components/pages/admin.js')).default,
  [PAGE_NAME.tests]: async () => (await import('../components/pages/tests.js')).default,
  [PAGE_NAME.search]: async () => (await import('../components/pages/search.js')).default,
  [PAGE_NAME.batches]: async () => (await import('../components/pages/batches.js')).default,
  [PAGE_NAME.register]: async () => (await import('../components/pages/register.js')).default,
  [PAGE_NAME.revision]: async () => (await import('../components/pages/revision.js')).default,
  [PAGE_NAME.dashboard]: async () => (await import('../components/pages/dashboard.js')).default,
  [PAGE_NAME.redaction]: async () => (await import('../components/pages/redaction.js')).default,
  [PAGE_NAME.userProfile]: async () => (await import('../components/pages/user-profile.js')).default,
  [PAGE_NAME.resetPassword]: async () => (await import('../components/pages/reset-password.js')).default,
  [PAGE_NAME.browserNotSupported]: async () => (await import('../components/pages/browser-not-supported.js')).default,
  [PAGE_NAME.connectExternalAccount]: async () => (await import('../components/pages/connect-external-account.js')).default,
  [PAGE_NAME.roomMembershipConfirmation]: async () => (await import('../components/pages/room-membership-confirmation.js')).default
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
