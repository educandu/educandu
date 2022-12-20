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
    const uiLanguage = req.uiLanguage;
    const i18n = this.resourceManager.createI18n(uiLanguage);
    const props = { error, settings, uiLanguage, i18n };
    const styles = [{ href: '/main.css' }];

    const html = this.renderHtml({
      uiLanguage,
      title,
      styles,
      ContentRoot: ErrorPage,
      contentProps: props
    });

    const headers = this.getHeaders({ xFrameOptions: this.serverConfig.xFrameOptions });

    return res
      .status(error.status)
      .type('html')
      .set(headers)
      .send(html);
  }
}

export default ErrorPageRenderer;
