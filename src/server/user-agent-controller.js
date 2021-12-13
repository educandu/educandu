import Logger from '../common/logger.js';
import PageRenderer from './page-renderer.js';
import { PAGE_NAME } from '../domain/page-name.js';
const logger = new Logger(import.meta.url);

class UserAgentController {
  static get inject() { return [PageRenderer]; }

  constructor(pageRenderer) {
    this.pageRenderer = pageRenderer;
  }

  registerMiddleware(router) {
    // eslint-disable-next-line consistent-return
    router.use((req, res, next) => {
      logger.info(req.useragent);
      if (req.url.indexOf(PAGE_NAME.browserNotSupported) !== -1) {
        return next();
      }

      if (req.useragent.isIE || req.useragent.isSafari) {
        return res.redirect(301, `/${PAGE_NAME.browserNotSupported}`);
      }

      return next();
    });
  }

  registerPages(router) {
    router.get(`/${PAGE_NAME.browserNotSupported}`, (req, res) => {
      return this.pageRenderer.sendPage(req, res, PAGE_NAME.browserNotSupported);
    });
  }
}

export default UserAgentController;
