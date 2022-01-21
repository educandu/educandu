import React from 'react';
import parse5 from 'parse5';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { kebabCaseToCamelCase } from '../../utils/string-utils.js';

const parseElementDefinitions = memoizee(html => {
  const headElem = parse5.parse(html).childNodes[0].childNodes[0];
  return headElem.childNodes
    .filter(({ nodeName }) => !nodeName.startsWith('#'))
    .map(({ tagName, attrs }) => {
      const attributes = attrs.reduce((accu, { name, value }) => ({
        ...accu,
        [kebabCaseToCamelCase(name)]: value
      }), {});

      return { tagName, attributes };
    });
});

function PageTemplate({ language, title, content, styles, scripts, additionalHeadHtml }) {
  const additionalHeadElementDefinitions = parseElementDefinitions(additionalHeadHtml);

  const additionalHeadElements = additionalHeadElementDefinitions.map((elem, index) => {
    return React.createElement(elem.tagName, { key: index.toString(), ...elem.attributes });
  });

  const styleElements = styles.map((style, index) => {
    return style.href
      ? (<link key={index.toString()} rel="stylesheet" href={style.href} />)
      : (<style key={index.toString()} dangerouslySetInnerHTML={{ __html: style.content }} />);
  });

  const scriptElements = scripts.map((script, index) => {
    return script.src
      ? (<script key={index.toString()} type="module" src={script.src} />)
      : (<script key={index.toString()} type="module" dangerouslySetInnerHTML={{ __html: script.content }} />);
  });

  return (
    <html language={language}>
      <head>
        <title>{ title }</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {additionalHeadElements}
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
  additionalHeadHtml: PropTypes.string,
  content: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  scripts: PropTypes.array,
  styles: PropTypes.array,
  title: PropTypes.string.isRequired
};

PageTemplate.defaultProps = {
  additionalHeadHtml: '',
  scripts: [],
  styles: []
};

export default PageTemplate;
