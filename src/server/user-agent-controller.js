import Logger from '../common/logger.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';

const logger = new Logger(import.meta.url);
class UserAgentController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  isUnsuportedSafari(useragent) {
    if (useragent.isSafari) {
      const majorVersion = parseInt(useragent.version.substr(0, 2), 10);
      return majorVersion < 13;
    }
    return false;
  }

  handleDetectBrowserSupport(req, res, next) {
    if (req.url.indexOf(PAGE_NAME.browserNotSupported) !== -1) {
      return next();
    }

    if (req.useragent.isIE || this.isUnsuportedSafari(req.useragent)) {
      logger.warn(`Browser not supported. Redirecting due to useragent being: ${JSON.stringify(req.useragent)}`);
      return res.redirect(301, `/${PAGE_NAME.browserNotSupported}`);
    }

    return next();
  }

  registerMiddleware(router) {
    router.use((req, res, next) => this.handleDetectBrowserSupport(req, res, next));
  }

  handleGetNotSupportedBrowserPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.browserNotSupported);
  }

  registerPages(router) {
    router.get(
      `/${PAGE_NAME.browserNotSupported}`,
      (req, res) => this.handleGetNotSupportedBrowserPage(req, res)
    );
  }
}

export default UserAgentController;
