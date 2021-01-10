import { EOL } from 'os';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { resetServerContext } from 'react-beautiful-dnd';
import PageTemplate from '../components/templates/page-template';

class PageRendererBase {
  renderHtml({ language, title, styles, scripts, ContentRoot, contentProps }) {
    resetServerContext();

    const content = ReactDOMServer.renderToString(<ContentRoot {...contentProps} />);

    const pageProps = { language, title, content, styles, scripts };
    const page = ReactDOMServer.renderToStaticMarkup(<PageTemplate {...pageProps} />);

    return `<!DOCTYPE html>${EOL}${page}${EOL}`;
  }
}

export default PageRendererBase;
