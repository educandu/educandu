import { PAGE_NAME } from './page-name.js';
import { isBrowser } from '../ui/browser-helper.js';
import DefaultPageTemplateComponent from '../components/page.js';

const pageImporters = {
  [PAGE_NAME.doc]: async () => (await import('../components/pages/doc.js')).default,
  [PAGE_NAME.docs]: async () => (await import('../components/pages/docs.js')).default,
  [PAGE_NAME.login]: async () => (await import('../components/pages/login.js')).default,
  [PAGE_NAME.users]: async () => (await import('../components/pages/users.js')).default,
  [PAGE_NAME.index]: async () => (await import('../components/pages/index.js')).default,
  [PAGE_NAME.search]: async () => (await import('../components/pages/search.js')).default,
  [PAGE_NAME.account]: async () => (await import('../components/pages/account.js')).default,
  [PAGE_NAME.editDoc]: async () => (await import('../components/pages/edit-doc.js')).default,
  [PAGE_NAME.settings]: async () => (await import('../components/pages/settings.js')).default,
  [PAGE_NAME.register]: async () => (await import('../components/pages/register.js')).default,
  [PAGE_NAME.resetPassword]: async () => (await import('../components/pages/reset-password.js')).default,
  [PAGE_NAME.completeRegistration]: async () => (await import('../components/pages/complete-registration.js')).default,
  [PAGE_NAME.completePasswordReset]: async () => (await import('../components/pages/complete-password-reset.js')).default,
  [PAGE_NAME.importBatches]: async () => (await import('../components/pages/import-batches.js')).default,
  [PAGE_NAME.importBatchView]: async () => (await import('../components/pages/import-batch-view.js')).default,
  [PAGE_NAME.importBatchCreation]: async () => (await import('../components/pages/import-batch-creation.js')).default
};

async function resolveAll(promiseCreators) {
  // eslint-disable-next-line no-process-env
  if (!isBrowser() && process.env.EDUCANDU_TEST === true.toString()) {
    // Resolve sequentially in the test runner,
    // because otherwise Jest bursts into flames:
    // https://github.com/facebook/jest/issues/11434
    const results = [];
    for (const promiseCreator of promiseCreators) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await promiseCreator());
    }
    return results;
  }

  // Otherwise we can resolve everything in parallel:
  return Promise.all(promiseCreators.map(promiseCreator => promiseCreator()));
}

export default class PageResolver {
  constructor(bundleConfig) {
    this.bundleConfig = bundleConfig;
    this.cache = null;
  }

  async getPageComponentInfo(pageName) {
    if (!(pageName in pageImporters)) {
      throw new Error(`Invalid page name: '${pageName}'`);
    }

    const [PageComponent, PageTemplateComponent] = await resolveAll([
      pageImporters[pageName],
      () => this.bundleConfig.getPageTemplateComponent(pageName)
    ]);

    return {
      PageComponent,
      PageTemplateComponent: PageTemplateComponent || DefaultPageTemplateComponent
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
    const allEntries = await resolveAll(allPageNames.map(pageName => () => getEntryFromPageName(pageName)));
    this.cache = Object.fromEntries(allEntries);
  }
}
