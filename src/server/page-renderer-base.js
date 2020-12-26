import { EOL } from 'os';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import PageTemplate from '../components/templates/page';
import { resetServerContext } from 'react-beautiful-dnd';

class PageRendererBase {
  renderHtml({ language, title, styles, scripts, ContentRoot, contentProps }) {
    resetServerContext();

    const contentElem = React.createElement(ContentRoot, contentProps);
    const content = ReactDOMServer.renderToString(contentElem);

    const pageProps = { language, title, content, styles, scripts };
    const pageElem = React.createElement(PageTemplate, pageProps);
    const page = ReactDOMServer.renderToStaticMarkup(pageElem);

    return `<!DOCTYPE html>${page}${EOL}`;
  }
}

export default PageRendererBase;
