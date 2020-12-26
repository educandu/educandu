import ErrorRoot from '../components/error-root';
import PageRendererBase from './page-renderer-base';

class ErrorPageRenderer extends PageRendererBase {
  sendPage(req, res, error) {
    const title = 'elmu';
    const language = 'de';
    const props = { error };
    const styles = [{ href: '/main.css' }];

    const html = this.renderHtml({
      language: language,
      title: title,
      styles: styles,
      ContentRoot: ErrorRoot,
      contentProps: props
    });

    return res.status(error.status).type('html').send(html);
  }
}

export default ErrorPageRenderer;
