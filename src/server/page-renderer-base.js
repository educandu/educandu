import React from 'react';
import { EOL } from 'node:os';
import ReactDOMServer from 'react-dom/server';
import { resetServerContext } from 'react-beautiful-dnd';
import PageTemplate from '../components/templates/page-template.js';

class PageRendererBase {
  renderHtml({ uiLanguage, title, styles, scripts, ContentRoot, contentProps, additionalHeadHtml }) {
    resetServerContext();

    const content = ReactDOMServer.renderToString(<ContentRoot {...contentProps} />);

    const pageProps = { uiLanguage, title, content, styles, scripts, additionalHeadHtml };
    const page = ReactDOMServer.renderToStaticMarkup(<PageTemplate {...pageProps} />);

    return `<!DOCTYPE html>${EOL}${page}${EOL}`;
  }
}

export default PageRendererBase;
