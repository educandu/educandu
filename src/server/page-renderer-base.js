const { EOL } = require('os');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const reactBeautifulDnd = require('react-beautiful-dnd');
const PageTemplate = require('../components/templates/page');

class PageRendererBase {
  renderHtml({ language, title, styles, scripts, ContentRoot, contentProps }) {
    reactBeautifulDnd.resetServerContext();

    const contentElem = React.createElement(ContentRoot, contentProps);
    const content = ReactDOMServer.renderToString(contentElem);

    const pageProps = { language, title, content, styles, scripts };
    const pageElem = React.createElement(PageTemplate, pageProps);
    const page = ReactDOMServer.renderToStaticMarkup(pageElem);

    return `<!DOCTYPE html>${page}${EOL}`;
  }
}

module.exports = PageRendererBase;
