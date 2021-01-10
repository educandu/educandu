import ErrorPage from '../components/error-page';
import PageRendererBase from './page-renderer-base';
import ResourceManager from '../resources/resource-manager';

class ErrorPageRenderer extends PageRendererBase {
  static get inject() { return [ResourceManager]; }

  constructor(resourceManager) {
    super();
    this.resourceManager = resourceManager;
  }

  sendPage(req, res, error) {
    const title = 'elmu';
    const language = req.language;
    const i18n = this.resourceManager.createI18n(language);
    const props = { error, i18n };
    const styles = [{ href: '/main.css' }];

    const html = this.renderHtml({
      language: language,
      title: title,
      styles: styles,
      ContentRoot: ErrorPage,
      contentProps: props
    });

    return res.status(error.status).type('html').send(html);
  }
}

export default ErrorPageRenderer;
