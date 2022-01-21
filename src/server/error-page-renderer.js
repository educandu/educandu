import ErrorPage from '../components/error-page.js';
import PageRendererBase from './page-renderer-base.js';
import ServerConfig from '../bootstrap/server-config.js';
import ResourceManager from '../resources/resource-manager.js';

class ErrorPageRenderer extends PageRendererBase {
  static get inject() { return [ServerConfig, ResourceManager]; }

  constructor(serverConfig, resourceManager) {
    super();
    this.serverConfig = serverConfig;
    this.resourceManager = resourceManager;
  }

  sendPage(req, res, error) {
    const title = this.serverConfig.appName;
    const settings = req.settings;
    const language = req.language;
    const i18n = this.resourceManager.createI18n(language);
    const props = { error, settings, language, i18n };
    const styles = [{ href: '/main.css' }];

    const html = this.renderHtml({
      language,
      title,
      styles,
      ContentRoot: ErrorPage,
      contentProps: props
    });

    return res.status(error.status).type('html').send(html);
  }
}

export default ErrorPageRenderer;
