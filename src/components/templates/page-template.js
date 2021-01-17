import React from 'react';
import parse5 from 'parse5';
import PropTypes from 'prop-types';
import faviconData from '../../../favicon-data.json';

const toElementDefinition = ({ tagName, attrs }) => {
  const props = attrs.reduce((accu, { name, value }) => {
    accu[name] = value;
    return accu;
  }, {});

  return { tagName, props };
};

const headElem = parse5.parse(faviconData.favicon.html_code).childNodes[0].childNodes[0];
const faviconDefs = headElem.childNodes.filter(({ nodeName }) => !nodeName.startsWith('#')).map(toElementDefinition);

function PageTemplate({ language, title, content, styles, scripts }) {
  const faviconElements = faviconDefs.map(({ tagName, props }, index) => {
    return React.createElement(tagName, { key: index.toString(), ...props });
  });

  const styleElements = styles.map((style, index) => {
    return style.href
      ? (<link key={index.toString()} rel="stylesheet" href={style.href} />)
      : (<style key={index.toString()} dangerouslySetInnerHTML={{ __html: style.content }} />);
  });

  const scriptElements = scripts.map((script, index) => {
    return script.src
      ? (<script key={index.toString()} src={script.src} />)
      : (<script key={index.toString()} dangerouslySetInnerHTML={{ __html: script.content }} />);
  });

  return (
    <html language={language}>
      <head>
        <title>{ title }</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {faviconElements}
        {styleElements}
      </head>
      <body>
        <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
        {scriptElements}
      </body>
    </html>
  );
}

PageTemplate.propTypes = {
  content: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  scripts: PropTypes.array,
  styles: PropTypes.array,
  title: PropTypes.string.isRequired
};

PageTemplate.defaultProps = {
  scripts: [],
  styles: []
};

export default PageTemplate;
