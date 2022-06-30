import { PAGE_NAME } from './page-name.js';
import DefaultSiteLogoComponent from '../components/default-site-logo.js';
import DefaultPageTemplateComponent from '../components/default-page-template.js';

const pageImporters = {
  [PAGE_NAME.doc]: async () => (await import('../components/pages/doc.js')).default,
  [PAGE_NAME.docs]: async () => (await import('../components/pages/docs.js')).default,
  [PAGE_NAME.revision]: async () => (await import('../components/pages/revision.js')).default,
  [PAGE_NAME.login]: async () => (await import('../components/pages/login.js')).default,
  [PAGE_NAME.users]: async () => (await import('../components/pages/users.js')).default,
  [PAGE_NAME.index]: async () => (await import('../components/pages/index.js')).default,
  [PAGE_NAME.search]: async () => (await import('../components/pages/search.js')).default,
  [PAGE_NAME.dashboard]: async () => (await import('../components/pages/dashboard.js')).default,
  [PAGE_NAME.admin]: async () => (await import('../components/pages/admin.js')).default,
  [PAGE_NAME.register]: async () => (await import('../components/pages/register.js')).default,
  [PAGE_NAME.resetPassword]: async () => (await import('../components/pages/reset-password.js')).default,
  [PAGE_NAME.completeRegistration]: async () => (await import('../components/pages/complete-registration.js')).default,
  [PAGE_NAME.completePasswordReset]: async () => (await import('../components/pages/complete-password-reset.js')).default,
  [PAGE_NAME.batches]: async () => (await import('../components/pages/batches.js')).default,
  [PAGE_NAME.imports]: async () => (await import('../components/pages/imports.js')).default,
  [PAGE_NAME.createImport]: async () => (await import('../components/pages/create-import.js')).default,
  [PAGE_NAME.browserNotSupported]: async () => (await import('../components/pages/browser-not-supported.js')).default,
  [PAGE_NAME.room]: async () => (await import('../components/pages/room.js')).default,
  [PAGE_NAME.roomMembershipConfirmation]: async () => (await import('../components/pages/room-membership-confirmation.js')).default,
  [PAGE_NAME.lesson]: async () => (await import('../components/pages/lesson.js')).default,
  [PAGE_NAME.tests]: async () => (await import('../components/pages/tests.js')).default
};

export default class PageResolver {
  constructor(bundleConfig) {
    this.bundleConfig = bundleConfig;
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
      this.bundleConfig.getPageTemplateComponent(pageName),
      this.bundleConfig.getHomePageTemplateComponent(pageName),
      this.bundleConfig.getSiteLogoComponent(pageName)
    ]);

    return {
      PageComponent,
      HomePageTemplateComponent: HomePageTemplateComponent || DefaultPageTemplateComponent,
      PageTemplateComponent: PageTemplateComponent || DefaultPageTemplateComponent,
      SiteLogoComponent: SiteLogoComponent || DefaultSiteLogoComponent
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

  async prefillCache() {
    const allPageNames = Object.keys(pageImporters);
    const getEntryFromPageName = async pageName => [pageName, await this.getPageComponentInfo(pageName)];
    const allEntries = await Promise.all(allPageNames.map(pageName => getEntryFromPageName(pageName)));
    this.cache = Object.fromEntries(allEntries);
  }
}
